import * as crypto from 'crypto';
import * as sodium from 'sodium-javascript';
import * as exceptions from '../../backlog/helpers/exceptions.js';
import * as constants from '../../backlog/helpers/constants';
import * as zSchema from 'z-schema';
// todo: implement
import * as logger from 'logger';
import { Account } from 'shared/model/account';
import { Block } from 'shared/model/block';
import { BlockRepo } from 'core/repository/block';
import { Transaction } from 'shared/model/transaction';
import { TransactionService, ITransactionService } from 'core/service/transaction';
import { TransactionQueue } from 'core/service/transactionQueue';
import { TransactionPoolService } from 'core/service/transactionPool';
import { TransactionRepo } from 'core/repository/transaction';
import { transactionSortFunc } from 'core/util/transaction';
import { getOrCreateAccount } from 'shared/util/account.utils';
import blockShema from 'core/shema/block';
import Response from 'shared/model/response';

interface IVerifyResult {
    verified: boolean;
    errors: any[];
}

class DelegateService {}

export class BlockService {
    private delegateService: DelegateService = new DelegateService();
    private transactionQueue: TransactionQueue<object> = new TransactionQueue({});
    private transactionPool: TransactionPoolService<object> = new TransactionPoolService({});
    private transactionService: ITransactionService<object> = new TransactionService();
    private transactionRepo: TransactionRepo = new TransactionRepo();
    private blockRepo: BlockRepo = new BlockRepo();

    private lastBlock: Block;
    private lastReceipt: number;
    private lastNBlockIds: string[];
    private readonly currentBlockVersion: number = constants.CURRENT_BLOCK_VERSION;
    private receiveLocked: boolean = false;

    private receiveLock(): void {
        this.receiveLocked = true;
    }

    private receiveUnlock(): void {
        this.receiveLocked = false;
    }

    public async generateBlock(keypair: { privateKey: string, publicKey: string }, timestamp: number): Promise<Response<void>> {
        const lockResponse: Response<void> = await this.lockTransactionPoolAndQueue();
        if (!lockResponse.success) {
            lockResponse.errors.push('generateBlock: Can\' lock transaction pool or/and queue');
            return lockResponse;
        }

        const transactions: Transaction<object>[] = await this.transactionPool.popSortedUnconfirmedTransactions(constants.maxTxsPerBlock);
        logger.debug(`[Process][newGenerateBlock][transactions] ${JSON.stringify(transactions)}`);

        const previousBlock: Block = this.getLastBlock();

        const createBlockResponse: Response<Block> = this.create({
            keypair,
            timestamp,
            previousBlock,
            transactions
        });
        if (!createBlockResponse.success) {
            return new Response<void>({ errors: [...createBlockResponse.errors, 'generate block'] });
        }
        const block: Block = createBlockResponse.data;

        const processBlockResponse: Response<void> = await this.processBlock(block, true, true, true, true);
        if (!processBlockResponse.success) {
            const pushResponse: Response<void> = await this.pushInPool(transactions);
            if (!pushResponse.success) {
                processBlockResponse.errors = [...processBlockResponse.errors, ...pushResponse.errors];
            }

            processBlockResponse.errors.push('generate block');
            return processBlockResponse;
        }

        const unlockResponse: Response<void> = await this.unlockTransactionPoolAndQueue();
        if (!unlockResponse.success) {
            unlockResponse.errors.push('generateBlock: Can\' unlock transaction pool or/and queue');
            return unlockResponse;
        }
        return new Response<void>();
    }

    private async pushInPool(transactions: Array<Transaction<object>>): Promise<Response<void>> {
        const errors: string[] = [];
        for (const trs of transactions) {
            let response: Response<void> = await this.transactionPool.push(trs);
            if (!response.success) {
                errors.push(...response.errors);
            }
        }
        return new Response<void>({ errors: errors });
    }

    private async lockTransactionPoolAndQueue(): Promise<Response<void>> {
        const queueLockResponse: Response<void> = await this.transactionQueue.lock();
        if (!queueLockResponse.success) {
            queueLockResponse.errors.push('lockTransactionPoolAndQueue');
            return queueLockResponse;
        }
        const poolLockResponse: Response<void> = await this.transactionPool.lock();
        if (!poolLockResponse.success) {
            poolLockResponse.errors.push('lockTransactionPoolAndQueue');
            return poolLockResponse;
        }
        return new Response<void>();
    }

    private async unlockTransactionPoolAndQueue(): Promise<Response<void>> {
        const queueUnlockResponse: Response<void> = await this.transactionQueue.unlock();
        if (!queueUnlockResponse.success) {
            queueUnlockResponse.errors.push('lockTransactionPoolAndQueue');
            return queueUnlockResponse;
        }
        const poolUnlockResponse: Response<void> = await this.transactionPool.unlock();
        if (!poolUnlockResponse.success) {
            poolUnlockResponse.errors.push('lockTransactionPoolAndQueue');
            return poolUnlockResponse;
        }
        return new Response<void>();
    }

    /**
     * @implements system.update
     */
    private async processBlock(block: Block, broadcast: boolean, saveBlock: boolean, verify: boolean = true, tick: boolean = true): Promise<Response<void>> {
        this.addBlockProperties(block, broadcast);

        const resultNormalizeBlock: Response<Block> = await this.normalizeBlock(block);
        if (!resultNormalizeBlock.success) {
            return new Response<void>({ errors: [...resultNormalizeBlock.errors, 'processBlock'] });
        }
        block = resultNormalizeBlock.data;

        if (verify) {
            const resultVerifyBlock: IVerifyResult = await this.verifyBlock(block);
            if (!resultVerifyBlock.verified) {
                return new Response<void>({ errors: [...resultVerifyBlock.errors, 'processBlock'] });
            }
        }

        if (saveBlock) {
            const resultCheckExists: Response<void> = await this.checkExists(block);
            if (!resultCheckExists.success) {
                return new Response<void>({ errors: [...resultCheckExists.errors, 'processBlock'] });
            }
        }
        // validateBlockSlot TODO enable after fix round

        const resultCheckTransactions: Response<void> = await this.checkTransactionsAndApplyUnconfirmed(block, saveBlock, verify);
        if (!resultCheckTransactions.success) {
            return new Response<void>({ errors: [...resultCheckTransactions.errors, 'processBlock'] });
        }

        const applyBlockResponse: Response<void> = await this.applyBlock(block, broadcast, saveBlock, tick);
        if (!applyBlockResponse.success) {
            return new Response<void>({ errors: [...applyBlockResponse.errors, 'processBlock'] });
        }

        if (!library.config.loading.snapshotRound) {
            await (new Promise((resolve, reject) => modules.system.update((err) => {
                if (err) {
                    logger.error(`[Verify][processBlock][system/update] ${err}`);
                    logger.error(`[Verify][processBlock][system/update][stack] ${err.stack}`);
                    reject(err);
                }
                resolve();
            })));
        }
        const reshuffleResponse: Response<void> = await this.transactionQueue.reshuffleTransactionQueue();
        if (!reshuffleResponse.success) {
            return new Response<void>({ errors: [...reshuffleResponse.errors, 'processBlock'] });
        }
        return new Response<void>();
    }

    private addBlockProperties(block: Block, broadcast: boolean): Block {
        if (broadcast) {
            return block;
        }
        block.totalAmount = block.totalAmount || 0;
        block.totalFee = block.totalFee || 0;
        block.reward = block.reward || 0;

        if (block.version === undefined) {
            block.version = constants.CURRENT_BLOCK_VERSION;
        }
        if (block.numberOfTransactions === undefined) {
            if (block.transactions === undefined) {
                block.numberOfTransactions = 0;
            } else {
                block.numberOfTransactions = block.transactions.length;
            }
        }
        if (block.payloadLength === undefined) {
            block.payloadLength = 0;
        }
        if (block.transactions === undefined) {
            block.transactions = [];
        }
        return block;
    }

    private async normalizeBlock(block: Block): Promise<Response<Block>> {
        block.transactions.sort(transactionSortFunc);
        const normalizeResponse: Response<Block> = await this.objectNormalize(block);
        if (!normalizeResponse.success) {
            normalizeResponse.errors.push('normalizeBlock');
            return normalizeResponse;
        }
        return normalizeResponse;
    }

    private async objectNormalize(block: Block): Promise<Response<Block>> {
        let i;

        for (i in block) {
            if (block[i] === null || typeof block[i] === 'undefined') {
                delete block[i];
            }
        }
        const report = zSchema.validate(block, blockShema);

        if (!report) {
            return new Response<Block>({ errors: [`Failed to validate block schema: ${zSchema.getLastErrors().map(err => err.message).join(', ')}`]});
        }

        const errors: string[] = [];
        for (i = 0; i < block.transactions.length; i++) {
            const response: Response<Transaction<object>> = await this.transactionService.objectNormalize(block.transactions[i]);
            if (!response.success) {
                errors.push(...response.errors);
            }
            block.transactions[i] = response.data;
        }

        return new Response<Block>({ data: block, errors: errors });
    }

    private async verifyBlock(block: Block): Promise<IVerifyResult> {
        const lastBlock: Block = this.getLastBlock();

        block = this.setHeight(block, lastBlock);

        let result: IVerifyResult = { verified: false, errors: [] };

        result = this.verifySignature(block, result);
        result = this.verifyPreviousBlock(block, result);
        result = this.verifyVersion(block, result);
        // TODO: verify total fee
        result = this.verifyId(block, result);
        result = this.verifyPayload(block, result);

        result = this.verifyForkOne(block, lastBlock, result);
        result = this.verifyBlockSlot(block, lastBlock, result);

        result.verified = result.errors.length === 0;
        result.errors.reverse();

        return result;
    }

    private setHeight(block: Block, lastBlock: Block): Block {
        block.height = lastBlock.height + 1;
        return block;
    }

    private verifySignature(block: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    private verifyPreviousBlock(block: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    private verifyVersion(block: Block, result: IVerifyResult): IVerifyResult {
        const version: number = block.version;
        const height: number = block.height;
        const exceptionVersion = Object.keys(exceptions.blockVersions).find(
            (exceptionVersion) => {
                // Get height range of current exceptions
                const heightsRange = exceptions.blockVersions[exceptionVersion];
                // Check if provided height is between the range boundaries
                return height >= heightsRange.start && height <= heightsRange.end;
            }
        );
        if (exceptionVersion === undefined) {
            // If there is no exception for provided height - check against current block version
            result.verified = version === this.currentBlockVersion;
        }

        // If there is an exception - check if version match
        // return Number(exceptionVersion) === version;
        return result;
    }

    private verifyId(block: Block, result: IVerifyResult): IVerifyResult {
        const idResponse: Response<string> = this.getId(block);
        if (!idResponse.success) {
            result.errors.push( ...idResponse.errors );
            return result;
        }
        block.id = idResponse.data;
        return result;
    }

    private getId(block: Block): Response<string> {
        let id: string = null;
        try {
            id = crypto.createHash('sha256').update(this.getBytes(block)).digest('hex');
        } catch (err) {
            return new Response<string>({ errors: [err, 'getId'] });
        }
        return new Response<string>({ data: id });
    }

    private verifyPayload(block: Block, result: IVerifyResult): IVerifyResult {
        const bytes = this.transactionService.getBytes(transaction, false, false);
        return result;
    }

    /**
     * @implements delegateService.fork
     */
    private verifyForkOne(block: Block, lastBlock: Block, result: IVerifyResult): IVerifyResult {
        this.delegateService.fork(block, 1);
        return result;
    }

    private verifyBlockSlot(block: Block, lastBlock: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    private async checkExists(block: Block): Promise<Response<void>> {
        const existsResponse: Response<boolean> = await this.blockRepo.isBlockExists(block.id);
        if (!existsResponse.success) {
            return new Response<void>({ errors: [...existsResponse.errors, 'checkExists'] });
        }
        if (!existsResponse.data) {
            return new Response<void>({ errors: [['Block', block.id, 'already exists'].join(' ')] });
        }
        return new Response<void>();
    }

    private async checkTransactionsAndApplyUnconfirmed(block: Block, checkExists: boolean, verify: boolean): Promise<Response<void>> {
        const errors = [];
        let i = 0;

        while ((i < block.transactions.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
            const trs: Transaction<object> = block.transactions[i];

            if (errors.length === 0) {
                const sender: Account = await getOrCreateAccount(trs.senderPublicKey);
                logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][sender] ${JSON.stringify(sender)}`);
                if (verify) {
                    const resultCheckTransaction: Response<void> = await this.checkTransaction(block, trs, sender, checkExists);
                    if (!resultCheckTransaction.success) {
                        errors.push(resultCheckTransaction.errors);
                        i--;
                        continue;
                    }
                }

                const applyResponse: Response<void> = await this.transactionService.applyUnconfirmed(trs);
                if (!applyResponse.success) {
                    errors.push(...applyResponse.errors);
                }
                i++;
            } else {
                const undoResponse: Response<void> = await this.transactionService.undoUnconfirmed(trs);
                if (!undoResponse.success) {
                    errors.push(...undoResponse.errors);
                }
                i--;
            }
        }

        return new Response<void>({ errors: errors });
    }

    private async checkTransaction(block: Block, trs: Transaction<object>, sender: Account, checkExists: boolean): Promise<Response<void>> {
        const transactionIdResponse: Response<string> = await this.transactionService.getId(trs);
        if (!transactionIdResponse.success) {
            return new Response<void>({ errors: [...transactionIdResponse.errors, 'checkTransaction']});
        }
        trs.id = transactionIdResponse.data;
        trs.blockId = block.id;

        const verifyResult: Response<void> = await this.transactionService.verify(trs, sender, checkExists);
        if (!verifyResult.success) {
            return new Response<void>({ errors: [...verifyResult.errors, 'checkTransaction']});
        }

        const verifyUnconfirmedResult: Response<void> = await this.transactionService.verifyUnconfirmed(trs, sender);
        if (!verifyUnconfirmedResult.success) {
            return new Response<void>({ errors: [...verifyUnconfirmedResult.errors, 'checkTransaction']});
        }

        return new Response<void>();
    }

    /**
     * @implements rounds.tick
     */
    private async applyBlock(block: Block, broadcast: boolean, saveBlock: boolean, tick: boolean): Promise<Response<void>> {
        if (saveBlock) {
            const saveBlockResponse: Response<void> = await this.blockRepo.saveBlock(block);
            if (!saveBlockResponse.success) {
                return new Response<void>({ errors: [...saveBlockResponse.errors, 'applyBlock'] });
            }
        }

        const errors: string[] = [];
        for (const trs of block.transactions) {
            const applyResponse: Response<void> = await this.transactionService.apply(trs, block);
            if (!applyResponse.success) {
                errors.push(...applyResponse.errors);
            }
            if (saveBlock) {
                trs.blockId = block.id;
                const saveResponse: Response<void> = await this.transactionRepo.saveTransaction(trs);
                if (!saveResponse.success) {
                    errors.push(...saveResponse.errors);
                }
            }
        }
        if (errors.length) {
            return new Response<void>({ errors: [...errors, 'applyBlock'] });
        }

        if (saveBlock) {
            const afterSaveResponse: Response<void> = await this.afterSave(block);
            if (!afterSaveResponse.success) {
                return new Response<void>({ errors: [...afterSaveResponse.errors, 'applyBlock'] });
            }
            logger.debug(`Block applied correctly with ${block.transactions.length} transactions`);
        }

        this.setLastBlock(block);
        library.bus.message('newBlock', block, broadcast);

        if (tick) {
            await (new Promise((resolve, reject) => modules.rounds.tick(block, (err, message) => {
                if (err) {
                    logger.error(`[Chain][applyBlock][tick]: ${err}`);
                    logger.error(`[Chain][applyBlock][tick][stack]: \n ${err.stack}`);
                    reject(err);
                }
                logger.debug(`[Chain][applyBlock][tick] message: ${message}`);
                resolve();
            })));
        }
        block = null;
        return new Response<void>();
    }

    private async afterSave(block: Block): Promise<Response<void>> {
        // todo: call 'transactionsSaved' on bus
        const errors: string[] = [];
        for (const trs of block.transactions) {
            // how can I call this method in case it exists in service but connection service=service is baned
            const afterSaveResponse: Response<void> = await this.transactionService.afterSave(trs);
            if (!afterSaveResponse.success) {
                errors.push(...afterSaveResponse.errors);
            }
        }
        return new Response<void>({ errors });
    }

    /**
     * @implements modules.rounds.calc()
     * @implements slots.getSlotNumber
     * @implements modules.loader.syncing
     * @implements modules.rounds.ticking
     */
    public async processIncomingBlock(block: Block): Promise<Response<void>> {
        if (this.receiveLocked) {
            logger.warn(`[Process][onReceiveBlock] locked for id ${block.id}`);
            return new Response({ errors: ['receiveLocked'] });
        }

        // TODO: how to check?
        if (!__private.loaded || modules.loader.syncing() || modules.rounds.ticking()) {
            logger.debug(`[Process][onReceiveBlock] !__private.loaded ${!__private.loaded}`);
            logger.debug(`[Process][onReceiveBlock] syncing ${modules.loader.syncing()}`);
            logger.debug('Client not ready to receive block', block.id);
            return new Response({ errors: ['module not loaded'] });
        }

        // Get the last block
        let lastBlock: Block = this.getLastBlock();

        // Detect sane block
        if (block.previousBlock === lastBlock.id && lastBlock.height + 1 === block.height) {
            this.receiveLock();
            await this.receiveBlock(block);
            this.receiveUnlock();
        } else if (block.previousBlock !== lastBlock.id && lastBlock.height + 1 === block.height) {
            return this.receiveForkOne(block, lastBlock);
        } else if (
            block.previousBlock === lastBlock.previousBlock &&
            block.height === lastBlock.height && block.id !== lastBlock.id
        ) {
            return this.receiveForkFive(block, lastBlock);
        } else if (block.id === lastBlock.id) {
            logger.debug('Block already processed', block.id);
        } else {
            logger.warn([
                'Discarded block that does not match with current chain:', block.id,
                'height:', block.height,
                'round:', modules.rounds.calc(block.height),
                'slot:', slots.getSlotNumber(block.timestamp),
                'generator:', block.generatorPublicKey
            ].join(' '));
        }
    }

    /**
     * @implements modules.rounds.calc
     * @implements slots.getSlotNumber
     */
    private async receiveBlock(block: Block): Promise<Response<void>> {
        logger.info([
            'Received new block id:', block.id,
            'height:', block.height,
            'round:', modules.rounds.calc(block.height),
            'slot:', slots.getSlotNumber(block.timestamp),
            'reward:', block.reward
        ].join(' '));

        this.updateLastReceipt();

        const lockResponse: Response<void> = await this.lockTransactionPoolAndQueue();
        if (!lockResponse.success) {
            lockResponse.errors.push('receiveBlock: Can\' lock transaction pool or/and queue');
            return lockResponse;
        }

        const removedTransactionsResponse: Response<Array<Transaction<object>>> = await this.transactionPool.removeFromPool(block.transactions, true);
        if (!removedTransactionsResponse.success) {
            return new Response<void>({ errors: [...removedTransactionsResponse.errors, 'receiveBlock'] });
        }
        logger.debug(`[Process][newReceiveBlock] removedTransactions ${JSON.stringify(removedTransactionsResponse.data)}`);
        const removedTransactions = removedTransactionsResponse.data;

        // todo: wrong logic with errors!!!
        const errors: string[] = [];
        const processBlockResponse: Response<void> = await this.processBlock(block, true, true, true, true);
        if (!processBlockResponse.success) {
            errors.push(...processBlockResponse.errors);
        }
        const transactionForReturn = [];
        removedTransactions.forEach((removedTrs) => {
            if (!(block.transactions.find(trs => trs.id === removedTrs.id))) {
                transactionForReturn.push(removedTrs);
            }
        });
        const pushResponse: Response<void> = await this.pushInPool(transactionForReturn);
        if (!pushResponse.success) {
            errors.push(...pushResponse.errors);
        }
        const returnResponse: Response<void> = await this.transactionQueue.returnToQueueConflictedTransactionFromPool(block.transactions);
        if (!returnResponse.success) {
            errors.push(...returnResponse.errors);
        }
        if (errors.length) {
            const pushBackResponse: Response<void> = await this.pushInPool(removedTransactions);
            if (!pushBackResponse.success) {
                errors.push(...pushBackResponse.errors);
                logger.error(`[Process][newReceiveBlock] ${JSON.stringify(errors)}`);
            }
        }
        const unlockResponse: Response<void> = await this.unlockTransactionPoolAndQueue();
        if (!unlockResponse.success) {
            unlockResponse.errors.push('receiveBlock: Can\' unlock transaction pool or/and queue');
            return unlockResponse;
        }
        return new Response<void>({ errors });
    }

    /**
     * @implements modules.delegates.fork
     */
    private async receiveForkOne(block: Block, lastBlock: Block): Promise<Response<void>> {
        let tmpBlock: Block = {...block};
        this.delegateService.fork(block, 1);

        const normalizeResponse: Response<Block> = await this.objectNormalize(tmpBlock);
        if (!normalizeResponse.success) {
            return new Response<void>({ errors: [...normalizeResponse.errors, 'receiveForkOne'] });
        }
        tmpBlock = normalizeResponse.data;

        this.validateBlockSlot(block, lastBlock);
        const check = this.verifyReceipt(tmpBlock);

        const deleteFirstResponse: Response<Block> = await this.deleteLastBlock();
        if (!deleteFirstResponse.success) {
            return new Response<void>({ errors: [...deleteFirstResponse.errors, 'receiveForkOne'] });
        }

        const deleteSecondResponse: Response<Block> = await this.deleteLastBlock();
        if (!deleteSecondResponse.success) {
            return new Response<void>({ errors: [...deleteSecondResponse.errors, 'receiveForkOne'] });
        }
    }

    /**
     * @implements slots.calcRound
     * @implements modules.rounds.getSlotDelegatesCount
     * @implements delegateService.validateBlockSlotAgainstPreviousRound
     * @implements delegateService.validateBlockSlot
     */
    private validateBlockSlot(block: Block, lastBlock: Block): boolean {
        const roundNextBlock = slots.calcRound(block.height);
        const roundLastBlock = slots.calcRound(lastBlock.height);
        const activeDelegates = modules.rounds.getSlotDelegatesCount(block.height);

        this.delegateService.validateBlockSlotAgainstPreviousRound(block);
        this.delegateService.validateBlockSlot(block);
        return true;
    }

    private verifyReceipt(block: Block): IVerifyResult {
        const lastBlock = this.getLastBlock();

        block = this.setHeight(block, lastBlock);

        let result: IVerifyResult = { verified: false, errors: [] };

        result = this.verifySignature(block, result);
        result = this.verifyPreviousBlock(block, result);
        result = this.verifyAgainstLastNBlockIds(block, result);
        result = this.verifyBlockSlotWindow(block, result);
        result = this.verifyVersion(block, result);
        // TODO: verify total fee
        result = this.verifyId(block, result);
        result = this.verifyPayload(block, result);

        result.verified = result.errors.length === 0;
        result.errors.reverse();

        return result;
    }

    private verifyAgainstLastNBlockIds(block: Block, result: IVerifyResult): IVerifyResult {
        if (this.lastNBlockIds.indexOf(block.id) !== -1) {}
        return result;
    }

    private verifyBlockSlotWindow(block: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    private async receiveForkFive(block: Block, lastBlock: Block): Promise<Response<void>> {
        let tmpBlock: Block = {...block};
        modules.delegates.fork(block, 5);

        const normalizeResponse: Response<Block> = await this.objectNormalize(tmpBlock);
        if (!normalizeResponse.success) {
            return new Response<void>({ errors: [...normalizeResponse.errors, 'receiveForkFive'] });
        }
        tmpBlock = normalizeResponse.data;

        this.validateBlockSlot(tmpBlock, lastBlock);
        const check = this.verifyReceipt(tmpBlock);

        const deleteResponse: Response<Block> = await this.deleteLastBlock();
        if (!deleteResponse.success) {
            return new Response<void>({ errors: [...deleteResponse.errors, 'receiveForkFive'] });
        }

        const receiveBlockResponse: Response<void> = await this.receiveBlock(block);
        if (!receiveBlockResponse.success) {
            receiveBlockResponse.errors.push('receiveForkFive');
            return receiveBlockResponse;
        }
    }

    private async deleteLastBlock(): Promise<Response<Block>> {
        let lastBlock = this.getLastBlock();

        const popBlockResponse: Response<Block> = await this.popLastBlock(lastBlock);
        if (!popBlockResponse.success) {
            popBlockResponse.errors.push('receiveForkFive');
            return popBlockResponse;
        }
        const newLastBlock = popBlockResponse.data;

        return new Response<Block>({ data: this.setLastBlock(newLastBlock) });
    }

    /**
     * @implements modules.rounds.backwardTick
     */
    private async popLastBlock(oldLastBlock: Block): Promise<Response<Block>> {
        const loadBlocksPartResponse: Response<Block> = await this.loadBlocksPart(oldLastBlock.previousBlock);
        if (!loadBlocksPartResponse.success) {
            loadBlocksPartResponse.errors.push('receiveForkFive');
            return loadBlocksPartResponse;
        }
        let previousBlock: Block = loadBlocksPartResponse.data;

        const errors: string[] = [];
        oldLastBlock.transactions.reverse().forEach(async (transaction) => {
            const undoResponse: Response<void> = await this.transactionService.undo(transaction, oldLastBlock);
            if (!undoResponse.success) {
                errors.push(...undoResponse.errors);
            }
            const undoUnconfirmedResponse: Response<void> = await this.transactionService.undoUnconfirmed(transaction);
            if (!undoUnconfirmedResponse.success) {
                errors.push(...undoUnconfirmedResponse.errors);
            }
        });
        if (errors.length) {
            return new Response<Block>({ errors });
        }

        modules.rounds.backwardTick(oldLastBlock, previousBlock);

        const deleteBlockResponse: Response<void> = await this.blockRepo.deleteBlock(oldLastBlock.id);
        if (!deleteBlockResponse.success) {
            return new Response<Block>({ errors: [...deleteBlockResponse.errors, 'popLastBlock'] });
        }

        return new Response<Block>({ data: previousBlock });
    }

    private async loadBlocksPart(previousBlockId: string): Promise<Response<Block>> {
        const loadBlockResponse: Response<Block> = await this.blockRepo.loadFullBlockById(previousBlockId);
        if (!loadBlockResponse.success) {
            return new Response<Block>({ errors: [...loadBlockResponse.errors, 'loadBlocksPart'] });
        }
        const block: Block = loadBlockResponse.data;

        const readBlockResponse: Response<Block> = await this.readDbRow(block);
        if (!readBlockResponse.success) {
            return new Response<Block>({ errors: [...readBlockResponse.errors, 'loadBlocksPart'] });
        }
        return new Response<Block>({ data: readBlockResponse.data });
    }

    private async readDbRows(rows: object[]): Promise<Response<Block[]>> {
        const blocks = [];
        const errors: string[] = [];
        rows.forEach(async row => {
            const readResponse: Response<Block> = await this.readDbRow(row);
            if (!readResponse.success) {
                errors.push(...readResponse.errors);
            } else {
                blocks.push(readResponse.data);
            }
        });
        return new Response<Block[]>({ data: blocks, errors });
    }

    private async readDbRow(row: object): Promise<Response<Block>> {
        return new Response<Block>();
    }

    public getLastBlock(): Block {
        return this.lastBlock;
    }

    public setLastBlock(block: Block): Block {
        this.lastBlock = block;
        return this.lastBlock;
    }

    // called in sync
    public getLastReceipt(): number {
        return this.lastReceipt;
    }

    public updateLastReceipt(): number {
        this.lastReceipt = Math.floor(Date.now() / 1000);
        return this.lastReceipt;
    }

    // called in sync
    public isLastReceiptStale(): boolean {
        if (!this.lastReceipt) {
            return true;
        }
        const secondsAgo = Math.floor(Date.now() / 1000) - this.lastReceipt;
        return (secondsAgo > constants.blockReceiptTimeOut);
    }

    // called from app.js
    public async saveGenesisBlock(): Promise<Response<void>> {
        const existsResponse: Response<boolean> = await this.blockRepo.isBlockExists(genesisBlockId);
        if (!existsResponse.success) {
            return new Response<void>({ errors: [...existsResponse.errors, 'saveGenesisBlock'] });
        }
        if (!existsResponse.data) {
            await this.applyGenesisBlock(genesisBlock, false, true); // config.genesis.block
        }
    }

    private async applyGenesisBlock(block: Block, verify?: boolean, save?: boolean): Promise<Response<void>> {
        block.transactions = block.transactions.sort(transactionSortFunc);
        return await this.processBlock(block, false, save, verify, false);
    }

    // used by rpc getCommonBlock
    public async recoverChain(): Promise<Response<Block>> {
        return await this.deleteLastBlock();
    }

    // used by rpc getCommonBlock
    /**
     * @implements rounds.getSlotDelegatesCount
     */
    public getIdSequence(height: number): { firstHeight: number, ids: []} {
        const rows = this.blockRepo.getIdSequence({ height, limit: 5, delegates: Rounds.prototype.getSlotDelegatesCount(height) });
        return { firstHeight: rows[0].height, ids: ids.join(',') };
    }

    // called from loader
    public async loadBlocksOffset(limit: number, offset: number, verify: boolean): Promise<Response<Block>> {
        const loadResponse: Response<Block[]> = await this.blockRepo.loadBlocksOffset({});
        if (!loadResponse.success) {
            return new Response<Block>({ errors: [...loadResponse.errors, 'loadBlocksOffset'] });
        }

        const readResponse: Response<Block[]> = await this.readDbRows(loadResponse.data);
        if (!readResponse.success) {
            return new Response<Block>({ errors: [...readResponse.errors, 'loadBlocksOffset'] });
        }
        const blocks = readResponse.data;

        blocks.forEach(async (block) => {
            if (block.id === library.genesisblock.block.id) {
                return this.applyGenesisBlock(block);
            }

            const processResponse: Response<void> = await this.processBlock(block, false, false, verify);
            if (!processResponse.success) {
                return new Response<Block>({ errors: [...processResponse.errors, 'loadBlocksOffset'] });
            }
        });
        return new Response<Block>({ data: this.getLastBlock() });
    }

    private create(data): Response<Block> {
        const block: Block = new Block();
        this.sign(block, data.keypair);
        return new Response<Block>({ data: block });
    }

    private sign(block, keyPair) {
        const blockHash = this.getHash(block);
        const sig = Buffer.alloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(sig, blockHash, keyPair.privateKey);
        return sig.toString('hex');
    }

    private getHash(block: Block): Response<Uint8Array> {
        let hash: Uint8Array = null;
        try {
            hash = crypto.createHash('sha256').update(this.getBytes(block)).digest();
        } catch (err) {
            return new Response<Uint8Array>({ errors: [err, 'getHash'] });
        }
        return new Response<Uint8Array>({ data: hash });
    }

    private getBytes(block: Block): Buffer {
        return new Buffer([]);
    }

    // called from loader
    private async loadLastBlock(): Promise<Response<Block>> {
        const loadResponse: Response<Block> = await this.blockRepo.loadLastBlock();
        if (!loadResponse.success) {
            return new Response<Block>({ errors: [...loadResponse.errors, 'loadLastBlock'] });
        }
        const block: Block = loadResponse.data;
        const readResponse: Response<Block> = await this.readDbRow(block);
        if (!readResponse.success) {
            return new Response<Block>({ errors: [...readResponse.errors, 'loadLastBlock'] });
        }
        return readResponse;
    }

    public setLastNBlocks(blocks: string[]): void {
        this.lastNBlockIds = blocks;
    }

    public updateLastNBlocks(block): void {
        this.lastNBlockIds.push(block.id);
        if (this.lastNBlockIds.length > constants.blockSlotWindow) {
            this.lastNBlockIds.shift();
        }
    }
}
