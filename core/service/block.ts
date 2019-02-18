import * as crypto from 'crypto';
import * as sodium from 'sodium-javascript';
import BUFFER from 'core/util/buffer';

import Validator from 'z-schema';
import ZSchema from 'shared/util/z_schema';

const validator: Validator = new ZSchema({});

import {logger} from 'shared/util/logger';
import {Account} from 'shared/model/account';
import {Block} from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import {Transaction} from 'shared/model/transaction';
import TransactionService from 'core/service/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionPool from 'core/service/transactionPool';
import TransactionRepo from 'core/repository/transaction';
import {DelegateService} from 'core/service/delegate';
import slotService from 'core/service/slot';
import {RoundService} from 'core/service/round';
import {transactionSortFunc} from 'core/util/transaction';
import {getOrCreateAccount} from 'shared/util/account';
import blockShema from 'core/schema/block';
import Response from 'shared/model/response';
import {messageON} from 'shared/util/bus';
import config from 'shared/util/config';

interface IVerifyResult {
    verified?: boolean;
    errors: Array<any>;
}

interface IKeyPair {
    privateKey: string;
    publicKey: string;
}

enum Fork {
    ONE = '1',
    FIVE = '5'
}

class BlockService {
    // todo: remove after implemented as singleton
    private delegateService: DelegateService = new DelegateService();
    private roundService: RoundService = new RoundService();

    private secondsRadix = 1000;
    private lastBlock: Block;
    private lastReceipt: number;
    private lastNBlockIds: Array<string>;
    private readonly currentBlockVersion: number = config.constants.CURRENT_BLOCK_VERSION;
    private receiveLocked: boolean = false;

    private readonly BLOCK_BUFFER_SIZE
        = BUFFER.LENGTH.UINT32 // version
        + BUFFER.LENGTH.UINT32 // timestamp
        + BUFFER.LENGTH.DOUBLE_HEX // previousBlockId
        + BUFFER.LENGTH.UINT32 // transactionCount
        + BUFFER.LENGTH.INT64 // amount
        + BUFFER.LENGTH.INT64 // fee
        + BUFFER.LENGTH.HEX // payloadHash
        + BUFFER.LENGTH.HEX // generatorPublicKey
    ;

    private receiveLock(): void {
        this.receiveLocked = true;
    }

    private receiveUnlock(): void {
        this.receiveLocked = false;
    }

    public async generateBlock(keypair: IKeyPair, timestamp: number): Promise<Response<void>> {
        const lockResponse: Response<void> = await this.lockTransactionPoolAndQueue();
        if (!lockResponse.success) {
            lockResponse.errors.push('generateBlock: Can\' lock transaction pool or/and queue');
            return lockResponse;
        }

        const transactions: Array<Transaction<object>> =
            await TransactionPool.popSortedUnconfirmedTransactions(config.constants.maxTxsPerBlock);
        logger.debug(`[Process][newGenerateBlock][transactions] ${JSON.stringify(transactions)}`);

        const previousBlock: Block = this.getLastBlock();

        const block: Block = this.create({
            keypair,
            timestamp,
            previousBlock,
            transactions
        });

        const processBlockResponse: Response<void> = await this.processBlock(block, true, true, keypair, true, true);
        if (!processBlockResponse.success) {
            const returnResponse: Response<void> =
                await TransactionPool.returnToQueueConflictedTransactionFromPool(transactions);
            if (!returnResponse.success) {
                processBlockResponse.errors = [...processBlockResponse.errors, ...returnResponse.errors];
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
        const errors: Array<string> = [];
        for (const trs of transactions) {
            let response: Response<void> = await TransactionPool.push(trs);
            if (!response.success) {
                errors.push(...response.errors);
            }
        }
        return new Response<void>({errors: errors});
    }

    private async lockTransactionPoolAndQueue(): Promise<Response<void>> {
        const queueLockResponse: Response<void> = await TransactionQueue.lock();
        if (!queueLockResponse.success) {
            queueLockResponse.errors.push('lockTransactionPoolAndQueue');
            return queueLockResponse;
        }
        const poolLockResponse: Response<void> = await TransactionPool.lock();
        if (!poolLockResponse.success) {
            poolLockResponse.errors.push('lockTransactionPoolAndQueue');
            return poolLockResponse;
        }
        return new Response<void>({});
    }

    private async unlockTransactionPoolAndQueue(): Promise<Response<void>> {
        const queueUnlockResponse: Response<void> = await TransactionQueue.unlock();
        if (!queueUnlockResponse.success) {
            queueUnlockResponse.errors.push('lockTransactionPoolAndQueue');
            return queueUnlockResponse;
        }
        const poolUnlockResponse: Response<void> = await TransactionPool.unlock();
        if (!poolUnlockResponse.success) {
            poolUnlockResponse.errors.push('lockTransactionPoolAndQueue');
            return poolUnlockResponse;
        }
        return new Response<void>({});
    }

    /**
     * @implements system.update
     */
    private async processBlock(
        block: Block,
        broadcast: boolean,
        saveBlock: boolean,
        keypair: IKeyPair,
        verify: boolean = true,
        tick: boolean = true): Promise<Response<void>> {
        block = this.addBlockProperties(block, broadcast);

        const resultNormalizeBlock: Response<Block> = await this.normalizeBlock(block);
        if (!resultNormalizeBlock.success) {
            return new Response<void>({errors: [...resultNormalizeBlock.errors, 'processBlock']});
        }
        block = resultNormalizeBlock.data;

        if (verify) {
            const resultVerifyBlock: IVerifyResult = await this.verifyBlock(block, !keypair);
            if (!resultVerifyBlock.verified) {
                return new Response<void>({errors: [...resultVerifyBlock.errors, 'processBlock']});
            }
        }

        if (saveBlock) {
            const resultCheckExists: Response<void> = await this.checkExists(block);
            if (!resultCheckExists.success) {
                return new Response<void>({errors: [...resultCheckExists.errors, 'processBlock']});
            }
        }
        // validateBlockSlot TODO enable after fix round

        const resultCheckTransactions: Response<void> =
            await this.checkTransactionsAndApplyUnconfirmed(block, saveBlock, verify);
        if (!resultCheckTransactions.success) {
            return new Response<void>({errors: [...resultCheckTransactions.errors, 'processBlock']});
        }

        const applyBlockResponse: Response<void> = await this.applyBlock(block, broadcast, keypair, saveBlock, tick);
        if (!applyBlockResponse.success) {
            return new Response<void>({errors: [...applyBlockResponse.errors, 'processBlock']});
        }

        if (!config.config.loading.snapshotRound) {
            // todo modules.system.update?
        }
        const reshuffleResponse: Response<void> = await TransactionQueue.reshuffleTransactionQueue();
        if (!reshuffleResponse.success) {
            return new Response<void>({errors: [...reshuffleResponse.errors, 'processBlock']});
        }
        return new Response<void>();
    }

    private addBlockProperties(block: Block, broadcast: boolean): Block {
        if (broadcast) {
            return block;
        }
        block.amount = block.amount || 0;
        block.fee = block.fee || 0;

        if (block.version === undefined) {
            block.version = config.constants.CURRENT_BLOCK_VERSION;
        }
        if (block.transactionCount === undefined) {
            if (block.transactions === undefined) {
                block.transactionCount = 0;
            } else {
                block.transactionCount = block.transactions.length;
            }
        }
        if (block.transactions === undefined) {
            block.transactions = [];
        }
        return block;
    }

    private async normalizeBlock(block: Block): Promise<Response<Block>> {
        block.transactions = block.transactions.sort(transactionSortFunc);
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
        const report: boolean = validator.validate(block, blockShema);

        if (!report) {
            return new Response<Block>({
                errors: [`Failed to validate block schema: 
                ${validator.getLastErrors().map(err => err.message).join(', ')}`]
            });
        }

        const errors: Array<string> = [];
        for (i = 0; i < block.transactions.length; i++) {
            const response: Response<Transaction<object>> =
                await TransactionService.objectNormalize(block.transactions[i]);
            if (!response.success) {
                errors.push(...response.errors);
            }
            block.transactions[i] = response.data;
        }

        return new Response<Block>({data: block, errors: errors});
    }

    private async verifyBlock(block: Block, verify: boolean): Promise<IVerifyResult> {
        const lastBlock: Block = this.getLastBlock();

        block = this.setHeight(block, lastBlock);

        let result: IVerifyResult = {verified: false, errors: []};

        if (verify) {
            result = this.verifySignature(block, result);
        }

        result = this.verifyPreviousBlock(block, result);
        result = this.verifyVersion(block, result);
        // TODO: verify total fee

        if (verify) {
            result = this.verifyId(block, result);
            result = this.verifyPayload(block, result);
        }

        result = await this.verifyForkOne(block, lastBlock, result);
        result = this.verifyBlockSlot(block, lastBlock, result);

        result.verified = result.errors.length === 0;
        result.errors.reverse();

        if (result.verified) {
            logger.info(
                `Verify->verifyBlock succeeded for block ${block.id} at height ${
                    block.height
                    }.`
            );
        } else {
            logger.error(
                `Verify->verifyBlock failed for block ${block.id} at height ${
                    block.height
                    }.`,
                JSON.stringify(result.errors)
            );
        }
        return result;
    }

    private setHeight(block: Block, lastBlock: Block): Block {
        block.height = lastBlock.height + 1;
        return block;
    }

    private verifySignature(block: Block, result: IVerifyResult): IVerifyResult {
        let valid: boolean = false;
        const hash = crypto.createHash('sha256').update(this.getBytes(block)).digest();
        const blockSignatureBuffer = Buffer.from(block.signature, 'hex');
        const generatorPublicKeyBuffer = Buffer.from(block.generatorPublicKey, 'hex');

        try {
            valid = sodium.crypto_sign_verify_detached(blockSignatureBuffer, hash, generatorPublicKeyBuffer);
        } catch (e) {
            if (config.constants.VERIFY_BLOCK_SIGNATURE) {
                result.errors.push(e.toString());
            } else {
                logger.error(e.toString());
            }
        }

        if (!valid) {
            if (config.constants.VERIFY_BLOCK_SIGNATURE) {
                result.errors.push('Failed to verify block signature');
            } else {
                logger.error('Failed to verify block signature');
            }
        }
        return result;
    }

    private verifyPreviousBlock(block: Block, result: IVerifyResult): IVerifyResult {
        if (!block.previousBlockId && block.height !== 1) {
            if (config.constants.VERIFY_PREVIOUS_BLOCK) {
                result.errors.push('Invalid previous block');
            } else {
                logger.error('Invalid previous block');
            }
        }
        return result;
    }

    private verifyVersion(block: Block, result: IVerifyResult): IVerifyResult {
        const version: number = block.version;
        if (version !== this.currentBlockVersion) {
            if (config.constants.VERIFY_BLOCK_VERSION) {
                result.errors.push('Invalid block version',
                    'No exceptions found. Block version doesn\'t match te current one.');
            } else {
                logger.error('Invalid block version');
            }
        }
        return result;
    }

    private verifyId(block: Block, result: IVerifyResult): IVerifyResult {
        const idResponse: Response<string> = this.getId(block);
        if (!idResponse.success) {
            result.errors.push(...idResponse.errors);
            return result;
        }
        const blockId: string = idResponse.data;
        if (block.id !== blockId) {
            result.errors.push(`Block id is corrupted expected: ${blockId} actual: ${block.id}`);
        }
        return result;
    }

    private getId(block: Block): Response<string> {
        let id: string = null;
        try {
            id = crypto.createHash('sha256').update(this.getBytes(block)).digest('hex');
        } catch (err) {
            return new Response<string>({errors: [err, 'getId']});
        }
        return new Response<string>({data: id});
    }

    private verifyPayload(block: Block, result: IVerifyResult): IVerifyResult {
        if (block.transactions.length !== block.transactionCount) {
            if (config.constants.PAYLOAD_VALIDATE.MAX_TRANSACTION_LENGTH) {
                result.errors.push('Included transactions do not match block transactions count');
            } else {
                logger.error('Included transactions do not match block transactions count');
            }
        }

        if (block.transactions.length > config.constants.maxTxsPerBlock) {
            if (config.constants.PAYLOAD_VALIDATE.MAX_TRANSACTION_IN_BLOCK) {
                result.errors.push('Number of transactions exceeds maximum per block');
            } else {
                logger.error('Number of transactions exceeds maximum per block');
            }
        }

        let totalAmount = 0;
        let totalFee = 0;
        const payloadHash = crypto.createHash('sha256');
        const appliedTransactions = {};

        for (const trs of block.transactions) {
            let bytes;

            try {
                logger.debug(`Transaction ${JSON.stringify(trs)}`);
                bytes = TransactionService.getBytes(trs, false, false);
                logger.trace(`Bytes ${JSON.stringify(bytes)}`);
            } catch (e) {
                result.errors.push(e.toString());
            }

            if (appliedTransactions[trs.id]) {
                if (config.constants.PAYLOAD_VALIDATE.MAX_TRANSACTION_DUPLICATE) {
                    result.errors.push(`Encountered duplicate transaction: ${trs.id}`);
                } else {
                    logger.error(`Encountered duplicate transaction: ${trs.id}`);
                }
            }

            appliedTransactions[trs.id] = trs;
            if (bytes) {
                payloadHash.update(bytes);
            }
            totalAmount += trs.amount;
            totalFee += trs.fee;
        }
        const hex = payloadHash.digest().toString('hex');

        if (hex !== block.payloadHash) {
            if (config.constants.PAYLOAD_VALIDATE.INVALID_HASH) {
                result.errors.push('Invalid payload hash');
            } else {
                logger.error('Invalid payload hash');
            }
        }

        if (totalAmount !== block.amount) {
            if (config.constants.PAYLOAD_VALIDATE.TOTAL_AMOUNT) {
                result.errors.push('Invalid total amount');
            } else {
                logger.error('Invalid total amount');
            }
        }

        if (totalFee !== block.fee) {
            if (config.constants.PAYLOAD_VALIDATE.TOTAL_FEE) {
                result.errors.push(`Invalid total fee. Expected: ${totalFee}, actual: ${block.fee}`);
            } else {
                logger.error('Invalid total fee');
            }
        }
        return result;
    }

    private async verifyForkOne(block: Block, lastBlock: Block, result: IVerifyResult): Promise<IVerifyResult> {
        if (block.previousBlockId && block.previousBlockId !== lastBlock.id) {
            const forkResponse: Response<void> = await this.delegateService.fork(block, Fork.ONE);
            if (!forkResponse.success) {
                result.errors.push(...forkResponse.errors);
            }
            if (config.constants.VERIFY_BLOCK_FORK_ONE) {
                result.errors.push(['Invalid previous block:',
                    block.previousBlockId, 'expected:', lastBlock.id].join(' '));
            } else {
                logger.error(['Invalid previous block:', block.previousBlockId, 'expected:', lastBlock.id].join(' '));
            }
        }

        return result;
    }

    private verifyBlockSlot(block: Block, lastBlock: Block, result: IVerifyResult): IVerifyResult {
        const blockSlotNumber = slotService.getSlotNumber(block.createdAt);
        const lastBlockSlotNumber = slotService.getSlotNumber(lastBlock.createdAt);

        if (blockSlotNumber > slotService.getSlotNumber() || blockSlotNumber <= lastBlockSlotNumber) {
            if (config.constants.VERIFY_BLOCK_SLOT) {
                result.errors.push('Invalid block timestamp');
            } else {
                logger.error('Invalid block timestamp', JSON.stringify(block));
            }
        }
        return result;
    }

    private async checkExists(block: Block): Promise<Response<void>> {
        const existsResponse: Response<boolean> = await BlockRepo.isBlockExists(block.id);
        if (!existsResponse.success) {
            return new Response<void>({errors: [...existsResponse.errors, 'checkExists']});
        }
        if (!existsResponse.data) {
            return new Response<void>({errors: [['Block', block.id, 'already exists'].join(' ')]});
        }
        return new Response<void>();
    }

    private async checkTransactionsAndApplyUnconfirmed(
        block: Block,
        checkExists: boolean,
        verify: boolean): Promise<Response<void>> {
        const errors: Array<string> = [];
        let i = 0;

        while ((i < block.transactions.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
            const trs: Transaction<object> = block.transactions[i];

            if (errors.length === 0) {
                const sender: Account = await getOrCreateAccount(trs.senderPublicKey);
                logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][sender] ${JSON.stringify(sender)}`);
                if (verify) {
                    const resultCheckTransaction: Response<void> =
                        await this.checkTransaction(block, trs, sender, checkExists);
                    if (!resultCheckTransaction.success) {
                        errors.push(...resultCheckTransaction.errors);
                        logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][error] ${JSON.stringify(errors)}`);
                        i--;
                        continue;
                    }
                }

                const applyResponse: Response<void> = await TransactionService.applyUnconfirmed(trs);
                if (!applyResponse.success) {
                    errors.push(...applyResponse.errors);
                }
                i++;
            } else {
                const undoResponse: Response<void> = await TransactionService.undoUnconfirmed(trs);
                if (!undoResponse.success) {
                    errors.push(...undoResponse.errors);
                }
                i--;
            }
        }

        return new Response<void>({errors: errors});
    }

    private async checkTransaction(
        block: Block,
        trs: Transaction<object>,
        sender: Account,
        checkExists: boolean): Promise<Response<void>> {
        const transactionIdResponse: Response<string> = await TransactionService.getId(trs);
        if (!transactionIdResponse.success) {
            return new Response<void>({errors: [...transactionIdResponse.errors, 'checkTransaction']});
        }
        trs.id = transactionIdResponse.data;
        trs.blockId = block.id;

        const verifyResult: IVerifyResult = await TransactionService.verify(trs, sender, checkExists);
        if (!verifyResult.verified) {
            return new Response<void>({errors: [...verifyResult.errors, 'checkTransaction']});
        }

        const verifyUnconfirmedResult: Response<void> = await TransactionService.verifyUnconfirmed(trs, sender);
        if (!verifyUnconfirmedResult.success) {
            return new Response<void>({errors: [...verifyUnconfirmedResult.errors, 'checkTransaction']});
        }

        return new Response<void>();
    }

    private async applyBlock(
        block: Block,
        broadcast: boolean,
        keypair: IKeyPair,
        saveBlock: boolean,
        tick: boolean): Promise<Response<void>> {
        if (keypair) {
            const addPayloadHashResponse: Response<Block> = this.addPayloadHash(block, keypair);
            if (!addPayloadHashResponse.success) {
                return new Response<void>({errors: [...addPayloadHashResponse.errors, 'applyBlock']});
            }
            block = addPayloadHashResponse.data;
        }

        if (saveBlock) {
            const saveBlockResponse: Response<void> = await BlockRepo.saveBlock(block);
            if (!saveBlockResponse.success) {
                return new Response<void>({errors: [...saveBlockResponse.errors, 'applyBlock']});
            }
        }

        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            const applyResponse: Response<void> = await TransactionService.apply(trs, block);
            if (!applyResponse.success) {
                errors.push(...applyResponse.errors);
            }
            if (saveBlock) {
                trs.blockId = block.id;
                const saveResponse: Response<void> = await TransactionRepo.saveTransaction(trs);
                if (!saveResponse.success) {
                    errors.push(...saveResponse.errors);
                }
            }
        }
        if (errors.length) {
            return new Response<void>({errors: [...errors, 'applyBlock']});
        }

        if (saveBlock) {
            const afterSaveResponse: Response<void> = await this.afterSave(block);
            if (!afterSaveResponse.success) {
                return new Response<void>({errors: [...afterSaveResponse.errors, 'applyBlock']});
            }
            logger.debug(`Block applied correctly with ${block.transactions.length} transactions`);
        }

        this.setLastBlock(block);
        messageON('NEW_BLOCKS', block);

        if (tick) {
            await this.roundService.generateRound();
        }
        block = null;
        return new Response<void>();
    }

    private addPayloadHash(block: Block, keypair: IKeyPair): Response<Block> {
        const payloadHash = crypto.createHash('sha256');
        for (let i = 0; i < block.transactions.length; i++) {
            const transaction = block.transactions[i];
            const bytes = TransactionService.getBytes(transaction);

            block.fee += transaction.fee;
            block.amount += transaction.amount;

            payloadHash.update(bytes);
        }

        block.payloadHash = payloadHash.digest().toString('hex');

        block.signature = this.sign(block, keypair);
        const idResponse: Response<string> = this.getId(block);
        if (!idResponse.success) {
            return new Response<Block>({errors: [...idResponse.errors, 'addPayloadHash']});
        }
        block.id = idResponse.data;
        return new Response<Block>({data: block});
    }

    private async afterSave(block: Block): Promise<Response<void>> {
        messageON('transactionsSaved', block.transactions);
        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            // how can I call this method in case it exists in service but connection service=service is baned
            const afterSaveResponse: Response<void> = await TransactionService.afterSave(trs);
            if (!afterSaveResponse.success) {
                errors.push(...afterSaveResponse.errors);
                logger.error(`[Chain][afterSave]: ${JSON.stringify(afterSaveResponse.errors)}`);
            }
        }
        return new Response<void>({errors});
    }

    /**
     * @implements modules.rounds.calc()
     * @implements modules.loader.syncing
     * @implements modules.rounds.ticking
     */
    public async processIncomingBlock(block: Block): Promise<Response<void>> {
        if (this.receiveLocked) {
            logger.warn(`[Process][onReceiveBlock] locked for id ${block.id}`);
            return new Response({errors: ['receiveLocked']});
        }

        // TODO: how to check?
        /*
        if (!__private.loaded || modules.loader.syncing() || modules.rounds.ticking()) {
            logger.debug(`[Process][onReceiveBlock] !__private.loaded ${!__private.loaded}`);
            logger.debug(`[Process][onReceiveBlock] syncing ${modules.loader.syncing()}`);
            logger.debug('Client not ready to receive block', block.id);
            return new Response({ errors: ['module not loaded'] });
        }
        */

        // Get the last block
        let lastBlock: Block = this.getLastBlock();

        // Detect sane block
        if (block.previousBlockId === lastBlock.id && lastBlock.height + 1 === block.height) {
            this.receiveLock();
            await this.receiveBlock(block);
            this.receiveUnlock();
        } else if (block.previousBlockId !== lastBlock.id && lastBlock.height + 1 === block.height) {
            return this.receiveForkOne(block, lastBlock);
        } else if (
            block.previousBlockId === lastBlock.previousBlockId &&
            block.height === lastBlock.height && block.id !== lastBlock.id
        ) {
            return this.receiveForkFive(block, lastBlock);
        } else if (block.id === lastBlock.id) {
            logger.debug('Block already processed', block.id);
        } else {
            logger.warn([
                'Discarded block that does not match with current chain:', block.id,
                'height:', block.height,
                'round:', this.roundService.calcRound(block.height),
                'slot:', slotService.getSlotNumber(block.createdAt),
                'generator:', block.generatorPublicKey
            ].join(' '));
        }
    }

    private async receiveBlock(block: Block): Promise<Response<void>> {
        logger.info([
            'Received new block id:', block.id,
            'height:', block.height,
            'round:', this.roundService.calcRound(block.height),
            'slot:', slotService.getSlotNumber(block.createdAt)
        ].join(' '));

        this.updateLastReceipt();

        const lockResponse: Response<void> = await this.lockTransactionPoolAndQueue();
        if (!lockResponse.success) {
            lockResponse.errors.push('receiveBlock: Can\' lock transaction pool or/and queue');
            return lockResponse;
        }

        const removedTransactionsResponse: Response<Array<Transaction<object>>> =
            await TransactionPool.removeFromPool(block.transactions, true);
        if (!removedTransactionsResponse.success) {
            return new Response<void>({errors: [...removedTransactionsResponse.errors, 'receiveBlock']});
        }
        logger.debug(`[Process][newReceiveBlock] removedTransactions 
            ${JSON.stringify(removedTransactionsResponse.data)}`);
        const removedTransactions: Array<Transaction<object>> = removedTransactionsResponse.data;

        // todo: wrong logic with errors!!!
        const errors: Array<string> = [];
        const processBlockResponse: Response<void> = await this.processBlock(block, true, true, null, true, true);
        if (!processBlockResponse.success) {
            errors.push(...processBlockResponse.errors);
        }
        const transactionForReturn: Array<Transaction<object>> = [];
        removedTransactions.forEach((removedTrs) => {
            if (!(block.transactions.find(trs => trs.id === removedTrs.id))) {
                transactionForReturn.push(removedTrs);
            }
        });
        const pushResponse: Response<void> = await this.pushInPool(transactionForReturn);
        if (!pushResponse.success) {
            errors.push(...pushResponse.errors);
        }
        const returnResponse: Response<void> =
            await TransactionPool.returnToQueueConflictedTransactionFromPool(block.transactions);
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
        return new Response<void>({errors});
    }

    private async receiveForkOne(block: Block, lastBlock: Block): Promise<Response<void>> {
        let tmpBlock: Block = {...block};
        const forkResponse: Response<void> = await this.delegateService.fork(block, Fork.ONE);
        if (!forkResponse.success) {
            return new Response<void>({errors: [...forkResponse.errors, 'receiveForkOne']});
        }
        if (block.createdAt > lastBlock.createdAt ||
            (block.createdAt === lastBlock.createdAt && block.id > lastBlock.id)) {
            logger.info('Last block stands');
            return new Response<void>();
        }
        logger.info('Last block and parent loses');
        const normalizeResponse: Response<Block> = await this.objectNormalize(tmpBlock);
        if (!normalizeResponse.success) {
            return new Response<void>({errors: [...normalizeResponse.errors, 'receiveForkOne']});
        }
        tmpBlock = normalizeResponse.data;

        const validateBlockSlotResponse: Response<void> = await this.validateBlockSlot(tmpBlock, lastBlock);
        if (!validateBlockSlotResponse.success) {
            return new Response<void>({errors: [...validateBlockSlotResponse.errors, 'receiveForkOne']});
        }

        const check = this.verifyReceipt(tmpBlock);
        if (!check.verified) {
            logger.error(['Block', tmpBlock.id, 'verification failed'].join(' '), check.errors.join(', '));
            return new Response<void>({errors: [...check.errors, 'receiveForkOne']});
        }

        const deleteFirstResponse: Response<Block> = await this.deleteLastBlock();
        if (!deleteFirstResponse.success) {
            return new Response<void>({errors: [...deleteFirstResponse.errors, 'receiveForkOne']});
        }

        const deleteSecondResponse: Response<Block> = await this.deleteLastBlock();
        if (!deleteSecondResponse.success) {
            return new Response<void>({errors: [...deleteSecondResponse.errors, 'receiveForkOne']});
        }
    }

    private async validateBlockSlot(block: Block, lastBlock: Block): Promise<Response<void>> {
        const roundNextBlock = this.roundService.calcRound(block.height);
        const roundLastBlock = this.roundService.calcRound(lastBlock.height);
        const activeDelegates = config.constants.activeDelegates;

        const errors: Array<string> = [];
        const validateBlockSlotAgainstPreviousRoundresponse: Response<void> =
            await this.delegateService.validateBlockSlotAgainstPreviousRound(block);
        if (!validateBlockSlotAgainstPreviousRoundresponse.success) {
            errors.push(...validateBlockSlotAgainstPreviousRoundresponse.errors);
        }
        const validateBlockSlot: Response<void> = await this.delegateService.validateBlockSlot(block);
        if (!validateBlockSlot.success) {
            errors.push(...validateBlockSlot.errors);
        }
        return new Response<void>({errors});
    }

    private verifyReceipt(block: Block): IVerifyResult {
        const lastBlock = this.getLastBlock();

        block = this.setHeight(block, lastBlock);

        let result: IVerifyResult = {verified: false, errors: []};

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
        if (this.lastNBlockIds.indexOf(block.id) !== -1) {
            if (config.constants.VERIFY_AGAINST_LAST_N_BLOCK_IDS) {
                result.errors.push('Block already exists in chain');
            } else {
                logger.error('Block already exists in chain');
            }
        }
        return result;
    }

    private verifyBlockSlotWindow(block: Block, result: IVerifyResult): IVerifyResult {
        const currentApplicationSlot = slotService.getSlotNumber();
        const blockSlot = slotService.getSlotNumber(block.createdAt);

        // Reject block if it's slot is older than BLOCK_SLOT_WINDOW
        if (currentApplicationSlot - blockSlot > config.constants.blockSlotWindow) {
            if (config.constants.VERIFY_BLOCK_SLOT_WINDOW) {
                result.errors.push('Block slot is too old');
            } else {
                logger.error('Block slot is too old');
            }
        }

        // Reject block if it's slot is in the future
        if (currentApplicationSlot < blockSlot) {
            if (config.constants.VERIFY_BLOCK_SLOT_WINDOW) {
                result.errors.push('Block slot is in the future');
            } else {
                logger.error('Block slot is in the future');
            }
        }

        return result;
    }

    private async receiveForkFive(block: Block, lastBlock: Block): Promise<Response<void>> {
        let tmpBlock: Block = {...block};
        const forkResponse: Response<void> = await this.delegateService.fork(block, Fork.FIVE);
        if (!forkResponse.success) {
            return new Response<void>({errors: [...forkResponse.errors, 'receiveForkFive']});
        }
        if (block.generatorPublicKey === lastBlock.generatorPublicKey) {
            logger.warn('Delegate forging on multiple nodes', block.generatorPublicKey);
        }
        if (block.createdAt > lastBlock.createdAt ||
            (block.createdAt === lastBlock.createdAt && block.id > lastBlock.id)) {
            logger.info('Last block stands');
            return new Response<void>();
        }
        logger.info('Last block loses');
        const normalizeResponse: Response<Block> = await this.objectNormalize(tmpBlock);
        if (!normalizeResponse.success) {
            return new Response<void>({errors: [...normalizeResponse.errors, 'receiveForkFive']});
        }
        tmpBlock = normalizeResponse.data;

        const validateBlockSlotResponse: Response<void> = await this.validateBlockSlot(tmpBlock, lastBlock);
        if (!validateBlockSlotResponse.success) {
            return new Response<void>({errors: [...validateBlockSlotResponse.errors, 'receiveForkFive']});
        }

        const check = this.verifyReceipt(tmpBlock);
        if (!check.verified) {
            logger.error(['Block', tmpBlock.id, 'verification failed'].join(' '), check.errors.join(', '));
            return new Response<void>({errors: [...check.errors, 'receiveForkOne']});
        }

        const deleteResponse: Response<Block> = await this.deleteLastBlock();
        if (!deleteResponse.success) {
            return new Response<void>({errors: [...deleteResponse.errors, 'receiveForkFive']});
        }

        const receiveBlockResponse: Response<void> = await this.receiveBlock(block);
        if (!receiveBlockResponse.success) {
            receiveBlockResponse.errors.push('receiveForkFive');
            return receiveBlockResponse;
        }
    }

    private async deleteLastBlock(): Promise<Response<Block>> {
        let lastBlock = this.getLastBlock();
        logger.warn(`Deleting last block: ${JSON.stringify(lastBlock)}`);
        if (lastBlock.height === 1) {
            return new Response<Block>({errors: ['Cannot delete genesis block']});
        }
        const popBlockResponse: Response<Block> = await this.popLastBlock(lastBlock);
        if (!popBlockResponse.success) {
            logger.error(`Error deleting last block: ${JSON.stringify(lastBlock)}, 
                message: ${JSON.stringify(popBlockResponse.errors)}`);
            popBlockResponse.errors.push('receiveForkFive');
            return popBlockResponse;
        }
        const newLastBlock = popBlockResponse.data;

        return new Response<Block>({data: this.setLastBlock(newLastBlock)});
    }

    private async popLastBlock(oldLastBlock: Block): Promise<Response<Block>> {
        logger.debug(`[Chain][popLastBlock] block: ${JSON.stringify(oldLastBlock)}`);
        let lastBlock: Block = this.getLastBlock();
        if (oldLastBlock.id !== lastBlock.id) {
            logger.error(`[Chain][popLastBlock] Block ${oldLastBlock.id} is not last`);
            return new Response<Block>({errors: [`Block is not last: ${JSON.stringify(oldLastBlock)}`]});
        }

        const loadBlocksPartResponse: Response<Block> = await this.loadBlocksPart(oldLastBlock.previousBlockId);
        if (!loadBlocksPartResponse.success) {
            loadBlocksPartResponse.errors.push('receiveForkFive');
            return loadBlocksPartResponse;
        }
        let previousBlock: Block = loadBlocksPartResponse.data;

        const errors: Array<string> = [];
        oldLastBlock.transactions.reverse().forEach(async (transaction) => {
            const undoResponse: Response<void> = await TransactionService.undo(transaction, oldLastBlock);
            if (!undoResponse.success) {
                errors.push(...undoResponse.errors);
            }
            const undoUnconfirmedResponse: Response<void> = await TransactionService.undoUnconfirmed(transaction);
            if (!undoUnconfirmedResponse.success) {
                errors.push(...undoUnconfirmedResponse.errors);
            }
        });
        if (errors.length) {
            return new Response<Block>({errors});
        }

        await this.roundService.rollBackRound(); // (oldLastBlock, previousBlock);

        const deleteBlockResponse: Response<void> = await BlockRepo.deleteBlock(oldLastBlock.id);
        if (!deleteBlockResponse.success) {
            return new Response<Block>({errors: [...deleteBlockResponse.errors, 'popLastBlock']});
        }

        return new Response<Block>({data: previousBlock});
    }

    private async loadBlocksPart(previousBlockId: string): Promise<Response<Block>> {
        logger.debug(`[Utils][loadBlocksPart]' previousBlockId: ${previousBlockId}`);
        const loadBlockResponse: Response<Block> = await BlockRepo.loadFullBlockById(previousBlockId);
        if (!loadBlockResponse.success) {
            return new Response<Block>({errors: [...loadBlockResponse.errors, 'loadBlocksPart']});
        }
        const block: Block = loadBlockResponse.data;

        const readBlockResponse: Response<Array<Block>> = await this.readDbRows([block]);
        if (!readBlockResponse.success) {
            return new Response<Block>({errors: [...readBlockResponse.errors, 'loadBlocksPart']});
        }
        return new Response<Block>({data: readBlockResponse.data[0]});
    }

    // may be redundant
    private async readDbRows(rows: Array<object>): Promise<Response<Array<Block>>> {
        const blocks = {};
        const order: Array<string> = [];
        const errors: Array<string> = [];
        rows.forEach(async row => {
            const block: Block = BlockRepo.dbRead(row);

            // If block is not already in the list...
            if (!blocks[block.id]) {
                if (block.id === config.genesisBlock.id) {
                    // Generate fake signature for genesis block
                    block.signature = (new Array(config.constants.signatureLength)).join('0');
                }

                // Add block ID to order list
                order.push(block.id);
                // Add block to list
                blocks[block.id] = block;
            }

            // Normalize transaction
            const transaction = TransactionService.dbRead(row);
            // Set empty object if there are no transactions in block
            blocks[block.id].transactions = blocks[block.id].transactions || {};

            if (transaction) {
                // Add transaction to block if not there already
                if (!blocks[block.id].transactions[transaction.id]) {
                    blocks[block.id].transactions[transaction.id] = transaction;
                }
            }
        });

        // Reorganize list
        const result: Array<Block> = order.map((v) => {
            blocks[v].transactions = Object.keys(blocks[v].transactions)
            .map(t => blocks[v].transactions[t]);
            return blocks[v];
        });

        return new Response<Array<Block>>({data: result, errors});
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
        this.lastReceipt = Math.floor(Date.now() / this.secondsRadix);
        return this.lastReceipt;
    }

    // called in sync
    public isLastReceiptStale(): boolean {
        if (!this.lastReceipt) {
            return true;
        }
        const secondsAgo = Math.floor(Date.now() / this.secondsRadix) - this.lastReceipt;
        return (secondsAgo > config.constants.blockReceiptTimeOut);
    }

    // called from app.js
    public async saveGenesisBlock(): Promise<Response<void>> {
        const existsResponse: Response<boolean> = await BlockRepo.isBlockExists(config.genesisBlock.id);
        if (!existsResponse.success) {
            return new Response<void>({errors: [...existsResponse.errors, 'saveGenesisBlock']});
        }
        if (!existsResponse.data) {
            await this.applyGenesisBlock(config.genesisBlock, false, true); // config.genesis.block
        }
    }

    private async applyGenesisBlock(block: Block, verify?: boolean, save?: boolean): Promise<Response<void>> {
        block.transactions = block.transactions.sort(transactionSortFunc);
        return await this.processBlock(block, false, save, null, verify, false);
    }

    // used by rpc getCommonBlock
    public async recoverChain(): Promise<Response<Block>> {
        return await this.deleteLastBlock();
    }

    // used by rpc getCommonBlock
    /**
     * @implements rounds.getSlotDelegatesCount
     */
    public async getIdSequence(height: number): Promise<Response<{ ids: string }>> {
        const lastBlock = this.getLastBlock();
        const rowsResponse: Response<Array<string>> =
            await BlockRepo.getIdSequence({height, limit: 5, delegates: config.constants.activeDelegates});
        if (!rowsResponse.success) {
            return new Response({errors: [...rowsResponse.errors, 'getIdSequence']});
        }
        const rows = rowsResponse.data;
        if (rows.length === 0) {
            return new Response({errors: [`Failed to get id sequence for height: ${height}`]});
        }
        const ids: Array<string> = [];
        // Add genesis block at the end if the set doesn't contain it already
        if (config.genesisBlock) {
            const genesisBlockId = config.genesisBlock.id;

            if (rows.indexOf(genesisBlockId) === -1) {
                rows.push(genesisBlockId);
            }
        }

        // Add last block at the beginning if the set doesn't contain it already
        if (lastBlock && rows.indexOf(lastBlock.id) === -1) {
            rows.unshift(lastBlock.id);
        }

        // Extract blocks IDs
        rows.forEach((row) => {
            // FIXME: Looks like double check
            if (ids.indexOf(row)) {
                ids.push(row);
            }
        });

        return new Response({data: {ids: ids.join(',')}});
    }

    // called from loader
    public async loadBlocksOffset(limit: number, offset: number, verify: boolean): Promise<Response<Block>> {
        const newLimit = limit + (offset || 0);
        const params = {limit: newLimit, offset: offset || 0};

        logger.debug('Loading blocks offset', {limit, offset, verify});

        const loadResponse: Response<Array<Block>> = await BlockRepo.loadBlocksOffset(params);
        if (!loadResponse.success) {
            return new Response<Block>({errors: [...loadResponse.errors, 'loadBlocksOffset']});
        }

        const readResponse: Response<Array<Block>> = await this.readDbRows(loadResponse.data);
        if (!readResponse.success) {
            return new Response<Block>({errors: [...readResponse.errors, 'loadBlocksOffset']});
        }
        const blocks: Array<Block> = readResponse.data;

        const errors: Array<string> = [];
        blocks.forEach(async (block) => {
            if (block.id === config.genesisBlock.id) {
                return await this.applyGenesisBlock(block);
            }

            const processResponse: Response<void> = await this.processBlock(block, false, false, null, verify);
            if (!processResponse.success) {
                errors.push(...processResponse.errors, 'loadBlocksOffset');
            }
        });
        return new Response<Block>({data: this.getLastBlock(), errors});
    }

    private create({transactions, timestamp, previousBlock, keypair}): Block {
        const blockTransactions = transactions.sort(transactionSortFunc);
        const block: Block = new Block({
            createdAt: timestamp,
            transactionCount: blockTransactions.length,
            previousBlockId: previousBlock.id,
            generatorPublicKey: keypair.publicKey.toString('hex'),
            transactions: blockTransactions
        });

        return block;
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
            return new Response<Uint8Array>({errors: [err, 'getHash']});
        }
        return new Response<Uint8Array>({data: hash});
    }

    private getBytes(block: Block): Buffer {
        const buf = Buffer.alloc(this.BLOCK_BUFFER_SIZE);
        let offset = 0;

        offset = BUFFER.writeInt32LE(buf, block.version, offset);
        offset = BUFFER.writeInt32LE(buf, block.createdAt, offset);

        if (block.previousBlockId) {
            buf.write(block.previousBlockId, offset, BUFFER.LENGTH.DOUBLE_HEX);
        }
        offset += BUFFER.LENGTH.DOUBLE_HEX;

        offset = BUFFER.writeInt32LE(buf, block.transactionCount, offset);
        offset = BUFFER.writeUInt64LE(buf, block.amount, offset);
        offset = BUFFER.writeUInt64LE(buf, block.fee, offset);

        buf.write(block.payloadHash, offset, BUFFER.LENGTH.HEX, 'hex');
        offset += BUFFER.LENGTH.HEX;

        buf.write(block.generatorPublicKey, offset, BUFFER.LENGTH.HEX, 'hex');

        return buf;
    }

    // called from loader
    private async loadLastBlock(): Promise<Response<Block>> {
        const loadResponse: Response<Block> = await BlockRepo.loadLastBlock();
        if (!loadResponse.success) {
            return new Response<Block>({errors: [...loadResponse.errors, 'loadLastBlock']});
        }
        const block: Block = loadResponse.data;
        const readResponse: Response<Array<Block>> = await this.readDbRows([block]);
        if (!readResponse.success) {
            return new Response<Block>({errors: [...readResponse.errors, 'loadLastBlock']});
        }
        return new Response({data: readResponse.data[0]});
    }

    public setLastNBlocks(blocks: Array<string>): void {
        this.lastNBlockIds = blocks;
    }

    public updateLastNBlocks(block): void {
        this.lastNBlockIds.push(block.id);
        if (this.lastNBlockIds.length > config.constants.blockSlotWindow) {
            this.lastNBlockIds.shift();
        }
    }
}

export default new BlockService();
