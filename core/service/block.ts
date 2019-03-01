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
import AccountRepo from 'core/repository/account';
import {Transaction} from 'shared/model/transaction';
import TransactionDispatcher from 'core/service/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionPool from 'core/service/transactionPool';
import TransactionRepo from 'core/repository/transaction';
import {DelegateService} from 'core/service/delegate';
import slotService from 'core/service/slot';
import RoundService from 'core/service/round';
import {transactionSortFunc} from 'core/util/transaction';
import {getOrCreateAccount} from 'shared/util/account';
import blockShema from 'core/schema/block';
import Response from 'shared/model/response';
import {messageON} from 'shared/util/bus';
import config from 'shared/util/config';
import SyncService from 'core/service/sync';
import system from 'core/repository/system';
import AccountRepository from 'core/repository/account';

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

    private secondsRadix = 1000;
    private lastReceipt: number;
    private readonly currentBlockVersion: number = config.constants.CURRENT_BLOCK_VERSION;
    private receiveLocked: boolean = false;

    private readonly BLOCK_BUFFER_SIZE
        = BUFFER.LENGTH.UINT32 // version
        + BUFFER.LENGTH.INT64 // timestamp
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
        logger.debug(`[Service][Block][generateBlock] timestamp ${timestamp}`);
        this.lockTransactionPoolAndQueue();

        const transactions: Array<Transaction<object>> =
            await TransactionPool.popSortedUnconfirmedTransactions(config.constants.maxTxsPerBlock);
        logger.debug(`[Process][newGenerateBlock][transactions] ${JSON.stringify(transactions)}`);

        const previousBlock: Block = BlockRepo.getLastBlock();

        const block: Block = this.create({
            keypair,
            timestamp,
            previousBlock,
            transactions
        });

        const processBlockResponse: Response<void> = await this.processBlock(block, true, true, keypair, false, true);
        if (!processBlockResponse.success) {
            const returnResponse: Response<void> =
                await TransactionDispatcher.returnToQueueConflictedTransactionFromPool(transactions);
            if (!returnResponse.success) {
                processBlockResponse.errors = [...processBlockResponse.errors, ...returnResponse.errors];
            }

            processBlockResponse.errors.push('generate block');
            return processBlockResponse;
        }

        this.unlockTransactionPoolAndQueue();

        return new Response<void>();
    }

    private async pushInPool(transactions: Array<Transaction<object>>): Promise<Response<void>> {
        const errors: Array<string> = [];
        for (const trs of transactions) {
            let response: Response<void> = await TransactionPool.push(trs, undefined, false, true);
            if (!response.success) {
                errors.push(...response.errors);
            }
        }
        return new Response<void>({errors: errors});
    }

    private lockTransactionPoolAndQueue(): void {
        TransactionQueue.lock();
        TransactionPool.lock();
    }

    private unlockTransactionPoolAndQueue(): void {
        TransactionQueue.unlock();
        TransactionPool.unlock();
        TransactionQueue.process();
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
        tick: boolean = true
    ): Promise<Response<void>> {
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
        } else {
            // TODO: remove when verify will be fix
            if (keypair) {
                const lastBlock: Block = BlockRepo.getLastBlock();
                block = this.setHeight(block, lastBlock);
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
        const reshuffleResponse: Response<void> = await TransactionQueue.reshuffle();
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
                await TransactionDispatcher.normalize(block.transactions[i]);
            if (!response.success) {
                errors.push(...response.errors);
            }

            block.transactions[i] = response.data;
        }

        return new Response<Block>({data: block, errors: errors});
    }

    private async verifyBlock(block: Block, verify: boolean): Promise<IVerifyResult> {
        const lastBlock: Block = BlockRepo.getLastBlock();

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
        result.verified = true;
        if (result.errors.length) {
            logger.error(`[Service][Block][verifyBlock] result.errors: ${result.errors}`);
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
                logger.error(`Failed to verify block signature`);
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
                bytes = TransactionDispatcher.getBytes(trs);
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
        const exists: boolean = BlockRepo.isExist(block.id);
        if (exists) {
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
                // const sender: Account = await getOrCreateAccount(trs.senderPublicKey);
                const sender: Account = AccountRepository.getByPublicKey(trs.senderPublicKey);
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

                const applyResponse: Response<void> = await TransactionDispatcher.applyUnconfirmed(trs, sender);
                if (!applyResponse.success) {
                    errors.push(...applyResponse.errors);
                }
                i++;
            } else {
                const undoResponse: Response<void> = await TransactionDispatcher.undoUnconfirmed(trs);
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
        trs.id = TransactionDispatcher.getId(trs);
        trs.blockId = block.id;

        const verifyResult = await TransactionDispatcher.verifyUnconfirmed(trs, sender, checkExists);
        if (!verifyResult.success) {
            return new Response<void>({errors: [...verifyResult.errors, 'checkTransaction']});
        }

        const verifyUnconfirmedResult: Response<void> = await TransactionDispatcher.verifyUnconfirmed(trs, sender);
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
            BlockRepo.add(block);
        }

        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            const sender = AccountRepo.getByPublicKey(trs.senderPublicKey);
            const applyResponse: Response<void> = await TransactionDispatcher.apply(trs, sender);
            if (!applyResponse.success) {
                errors.push(...applyResponse.errors);
            }
            if (saveBlock) {
                trs.blockId = block.id;
                TransactionRepo.add(trs);
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
            const trsLength = block.transactions.length;
            logger.debug(`[Service][Block][applyBlock] block ${block.id}, height: ${block.height}, ` +
                `applied with ${trsLength} transactions`
            );
        }

        BlockRepo.setLastBlock(block);
        messageON('NEW_BLOCKS', block);

        if (broadcast) {
            SyncService.sendNewBlock(block);
        }

        // TODO: is it necessary?
        // if (tick) {
        //     await RoundService.generateRound();
        // }
        return new Response<void>();
    }

    private addPayloadHash(block: Block, keypair: IKeyPair): Response<Block> {
        const payloadHash = crypto.createHash('sha256');
        for (let i = 0; i < block.transactions.length; i++) {
            const transaction = block.transactions[i];
            const bytes = TransactionDispatcher.getBytes(transaction);

            block.fee += transaction.fee;
            block.amount += transaction.amount;

            payloadHash.update(bytes);
        }

        block.payloadHash = payloadHash.digest().toString('hex');

        const signResponseEntity = this.sign(block, keypair);
        if (!signResponseEntity.success) {
            return new Response<Block>({ errors: [...signResponseEntity.errors, 'addPayloadHash'] });
        }

        block.signature = signResponseEntity.data;
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
            const afterSaveResponse: Response<void> = await TransactionDispatcher.afterSave(trs);
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
        logger.warn(`[Service][Block][processIncomingBlock] block id ${block.id}`);
        if (this.receiveLocked) {
            logger.warn(`[Process][onReceiveBlock] locked for id ${block.id}`);
            return new Response({errors: ['receiveLocked']});
        }

        this.lockTransactionPoolAndQueue();

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
        let lastBlock: Block = BlockRepo.getLastBlock();

        // Detect sane block
        const errors: Array<string> = [];
        this.receiveLock();
        if (block.previousBlockId === lastBlock.id && lastBlock.height + 1 === block.height) {
            const receiveResponse: Response<void> = await this.receiveBlock(block);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'processIncomingBlock');
            }
        } else if (block.previousBlockId !== lastBlock.id && lastBlock.height + 1 === block.height) {
            const receiveResponse: Response<void> = await this.receiveForkOne(block, lastBlock);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'processIncomingBlock');
            }
        } else if (
            block.previousBlockId === lastBlock.previousBlockId &&
            block.height === lastBlock.height && block.id !== lastBlock.id
        ) {
            const receiveResponse: Response<void> = await this.receiveForkFive(block, lastBlock);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'processIncomingBlock');
            }
        } else if (block.id === lastBlock.id) {
            logger.debug('Block already processed', block.id);
        } else {
            logger.warn([
                'Discarded block that does not match with current chain:', block.id,
                'height:', block.height,
                'round:', RoundService.calcRound(block.height),
                'slot:', slotService.getSlotNumber(block.createdAt),
                'generator:', block.generatorPublicKey
            ].join(' '));
        }

        this.receiveUnlock();
        this.unlockTransactionPoolAndQueue();

        return new Response<void>();
    }

    private async receiveBlock(block: Block): Promise<Response<void>> {
        logger.info([
            'Received new block id:', block.id,
            'height:', block.height,
            'round:', RoundService.calcRound(block.height),
            'slot:', slotService.getSlotNumber(block.createdAt)
        ].join(' '));

        this.updateLastReceipt();
        this.lockTransactionPoolAndQueue();

        const removedTransactionsResponse: Response<Array<Transaction<object>>> =
            await TransactionPool.batchRemove(block.transactions, true);
        if (!removedTransactionsResponse.success) {
            return new Response<void>({errors: [...removedTransactionsResponse.errors, 'receiveBlock']});
        }
        logger.debug(
            `[Process][newReceiveBlock] removedTransactions ${JSON.stringify(removedTransactionsResponse.data)}`
        );
        const removedTransactions: Array<Transaction<object>> = removedTransactionsResponse.data || [];

        // todo: wrong logic with errors!!!
        const errors: Array<string> = [];
        const processBlockResponse: Response<void> = await this.processBlock(block, false, true, null, false, true);
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
            await TransactionDispatcher.returnToQueueConflictedTransactionFromPool(block.transactions);
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
        this.unlockTransactionPoolAndQueue();
        return new Response<void>({errors});
    }

    private async receiveForkOne(block: Block, lastBlock: Block): Promise<Response<void>> {
        logger.debug(`[Service][Block][receiveForkOne] block ${JSON.stringify(block)}`);
        let tmpBlock: Block = block.getCopy();
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
        const roundNextBlock = RoundService.calcRound(block.height);
        const roundLastBlock = RoundService.calcRound(lastBlock.height);
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
        const lastBlock = BlockRepo.getLastBlock();

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
        const lastNBlockIds = BlockRepo.getLastNBlockIds();
        if (lastNBlockIds.indexOf(block.id) !== -1) {
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
        logger.debug(`[Service][Block][receiveForkFive] block ${JSON.stringify(block)}`);
        let tmpBlock: Block = block.getCopy();
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
        let lastBlock = BlockRepo.getLastBlock();
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

        return new Response<Block>({data: BlockRepo.setLastBlock(newLastBlock)});
    }

    private async popLastBlock(oldLastBlock: Block): Promise<Response<Block>> {
        logger.debug(`[Chain][popLastBlock] block: ${JSON.stringify(oldLastBlock)}`);
        let lastBlock: Block = BlockRepo.getLastBlock();
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
            const sender = AccountRepo.getByPublicKey(transaction.senderPublicKey);
            const undoResponse: Response<void> = await TransactionDispatcher.undo(transaction, sender);
            if (!undoResponse.success) {
                errors.push(...undoResponse.errors);
            }
            const undoUnconfirmedResponse: Response<void> = await TransactionDispatcher.undoUnconfirmed(transaction);
            if (!undoUnconfirmedResponse.success) {
                errors.push(...undoUnconfirmedResponse.errors);
            }
        });
        if (errors.length) {
            return new Response<Block>({errors});
        }

        await RoundService.rollBack(); // (oldLastBlock, previousBlock);

        const deletedBlockId = BlockRepo.delete(oldLastBlock);
        if (!deletedBlockId) {
            return new Response<Block>({errors: ['popLastBlock']});
        }

        return new Response<Block>({data: previousBlock});
    }

    private async loadBlocksPart(previousBlockId: string): Promise<Response<Block>> {
        logger.debug(`[Utils][loadBlocksPart]' previousBlockId: ${previousBlockId}`);
        const block: Block = await BlockRepo.getById(previousBlockId);
        if (!block) {
            return new Response<Block>({errors: ['loadBlocksPart']});
        }
        return new Response<Block>({data: block});
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
        const exists: boolean = BlockRepo.isExist(config.genesisBlock.id);
        if (!exists) {
            return await this.applyGenesisBlock(config.genesisBlock, false, true);
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
    /*
    public async getIdSequence(height: number): Promise<Response<{ ids: string }>> {
        const lastBlock = BlockRepo.getLastBlock();
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
    */

    // called from loader
    public async loadBlocksOffset(limit: number, offset: number, verify: boolean): Promise<Response<Block>> {
        const newLimit = limit + (offset || 0);
        logger.debug('Loading blocks offset', {limit, offset, verify});

        const blocks: Array<Block> = BlockRepo.getMany(offset || 0, newLimit);

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
        return new Response<Block>({data: BlockRepo.getLastBlock(), errors});
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

    private sign(block, keyPair): Response<string> {
        const blockHash = this.getHash(block);
        if (!blockHash.success) {
            return new Response({ errors: [...blockHash.errors, 'sign'] });
        }

        const sig = Buffer.alloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(sig, blockHash.data, keyPair.privateKey);
        return new Response<string>({ data: sig.toString('hex') });
    }

    private getHash(block: Block): Response<Buffer> {
        let hash: Buffer = null;
        try {
            hash = crypto.createHash('sha256').update(this.getBytes(block)).digest();
        } catch (err) {
            return new Response<Buffer>({errors: [err, 'getHash']});
        }
        return new Response<Buffer>({data: hash});
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

    public async loadBlocks(blocks: Array<Block>): Promise<void> {
        for (let block of blocks) {
            await this.receiveBlock(block);
        }
        return;
    }
}

export default new BlockService();
