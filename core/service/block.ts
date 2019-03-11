import * as crypto from 'crypto';
import * as sodium from 'sodium-javascript';
import BUFFER from 'core/util/buffer';

import Validator from 'z-schema';
import ZSchema from 'shared/util/z_schema';
import { logger } from 'shared/util/logger';
import { Account } from 'shared/model/account';
import { Block, BlockModel } from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import BlockPGRepo from 'core/repository/block/pg';
import AccountRepo from 'core/repository/account';
import AccountRepository from 'core/repository/account';
import { IAsset, IAssetTransfer, Transaction, TransactionType } from 'shared/model/transaction';
import TransactionDispatcher from 'core/service/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionPool from 'core/service/transactionPool';
import TransactionRepo from 'core/repository/transaction/';
import slotService from 'core/service/slot';
import RoundService from 'core/service/round';
import RoundRepository from 'core/repository/round';
import { transactionSortFunc } from 'core/util/transaction';
import blockSchema from 'core/schema/block';
import Response from 'shared/model/response';
import { messageON } from 'shared/util/bus';
import config from 'shared/util/config';
import SyncService from 'core/service/sync';
import system from 'core/repository/system';
import TransactionPGRepo from 'core/repository/transaction/pg';
import { getAddressByPublicKey } from 'shared/util/account';

const validator: Validator = new ZSchema({});

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

    private secondsRadix = 1000;
    private readonly currentBlockVersion: number = config.constants.CURRENT_BLOCK_VERSION;

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

    public async generateBlock(keyPair: IKeyPair, timestamp: number): Promise<Response<void>> {
        logger.debug(`[Service][Block][generateBlock] timestamp ${timestamp}`);
        this.lockTransactionPoolAndQueue();

        const transactions: Array<Transaction<object>> =
            TransactionPool.popSortedUnconfirmedTransactions(config.constants.maxTxsPerBlock);
        // logger.debug(`[Process][newGenerateBlock][transactions] ${JSON.stringify(transactions)}`);

        const previousBlock: Block = BlockRepo.getLastBlock();

        const block: Block = this.create({
            keyPair,
            timestamp,
            previousBlock,
            transactions
        });

        const processBlockResponse: Response<void> = await this.process(block, true, true, keyPair, false);
        if (!processBlockResponse.success) {
            TransactionDispatcher.returnToQueueConflictedTransactionFromPool(transactions);

            processBlockResponse.errors.push('[Process][newGenerateBlock] generate block');
            return processBlockResponse;
        }

        this.unlockTransactionPoolAndQueue();

        return new Response<void>();
    }

    private pushInPool(transactions: Array<Transaction<object>>): void {
        for (const trs of transactions) {
            TransactionPool.push(trs, undefined, false);
        }
    }

    private lockTransactionPoolAndQueue(): void {
        TransactionQueue.lock();
    }

    private unlockTransactionPoolAndQueue(): void {
        TransactionQueue.unlock();
        TransactionQueue.process();
    }

    /**
     * @implements system.update
     */
    private async process(
        block: Block,
        broadcast: boolean,
        saveBlock: boolean,
        keyPair: IKeyPair,
        verify: boolean = true
    ): Promise<Response<void>> {

        if (verify) {
            const resultVerifyBlock: IVerifyResult = this.verifyBlock(block, !keyPair);
            if (!resultVerifyBlock.verified) {
                return new Response<void>({errors: [...resultVerifyBlock.errors, 'processBlock']});
            }
        } else {
            // TODO: remove when validate will be fix
            if (keyPair) {
                const lastBlock: Block = BlockRepo.getLastBlock();
                block = this.setHeight(block, lastBlock);
            }
        }

        // todo fix issue with invalid block slot
        // const validationResponse = this.validateBlockSlot(block);
        // if (!validationResponse.success) {
        //     return new Response<void>({errors: [...validationResponse.errors, 'processBlock']});
        // }

        if (saveBlock) {
            const resultCheckExists: Response<void> = this.checkExists(block);
            if (!resultCheckExists.success) {
                return new Response<void>({errors: [...resultCheckExists.errors, 'processBlock']});
            }
        }

        const resultCheckTransactions: Response<void> =
            this.checkTransactionsAndApplyUnconfirmed(block, saveBlock, verify);
        if (!resultCheckTransactions.success) {
            return new Response<void>({errors: [...resultCheckTransactions.errors, 'processBlock']});
        }

        const applyBlockResponse: Response<void> = await this.applyBlock(block, broadcast, keyPair, saveBlock);
        if (!applyBlockResponse.success) {
            return new Response<void>({errors: [...applyBlockResponse.errors, 'processBlock']});
        }

        TransactionQueue.reshuffle();
        return new Response<void>();
    }

    public verifyBlock(block: Block, verify: boolean): IVerifyResult {
        const lastBlock: Block = BlockRepo.getLastBlock();

        let result: IVerifyResult = {verified: false, errors: []};

        if (verify) {
            result = this.verifySignature(block, result);
        }

        result = this.verifyPreviousBlock(block, result);
        result = this.verifyVersion(block, result);
        // TODO: validate total fee

        if (verify) {
            result = this.verifyId(block, result);
            result = this.verifyPayload(block, result);
        }

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
            result.errors.push(e.toString());
        }

        if (!valid) {
            result.errors.push('Failed to validate block signature');
        }
        return result;
    }

    private verifyPreviousBlock(block: Block, result: IVerifyResult): IVerifyResult {
        if (!block.previousBlockId && block.height !== 1) {
            result.errors.push('Invalid previous block');
        }
        return result;
    }

    private verifyVersion(block: Block, result: IVerifyResult): IVerifyResult {
        const version: number = block.version;
        if (version !== this.currentBlockVersion) {
            result.errors.push('Invalid block version',
                'No exceptions found. Block version doesn\'t match te current one.');
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
            result.errors.push('Included transactions do not match block transactions count');
        }

        if (block.transactions.length > config.constants.maxTxsPerBlock) {
            result.errors.push('Number of transactions exceeds maximum per block');
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
                result.errors.push(`Encountered duplicate transaction: ${trs.id}`);
            }

            appliedTransactions[trs.id] = trs;
            if (bytes) {
                payloadHash.update(bytes);
            }
            if (trs.type === TransactionType.SEND) {
                const asset: IAssetTransfer = <IAssetTransfer>trs.asset;
                totalAmount += asset.amount;
            }
            totalFee += trs.fee;
        }
        const hex = payloadHash.digest().toString('hex');

        if (hex !== block.payloadHash) {
            result.errors.push('Invalid payload hash');
        }

        if (totalAmount !== block.amount) {
            result.errors.push('Invalid total amount');
        }

        if (totalFee !== block.fee) {
            result.errors.push(`Invalid total fee. Expected: ${totalFee}, actual: ${block.fee}`);
        }
        return result;
    }

    private verifyBlockSlot(block: Block, lastBlock: Block, result: IVerifyResult): IVerifyResult {
        const blockSlotNumber = slotService.getSlotNumber(block.createdAt);
        const lastBlockSlotNumber = slotService.getSlotNumber(lastBlock.createdAt);

        if (blockSlotNumber > slotService.getSlotNumber() || blockSlotNumber <= lastBlockSlotNumber) {
            result.errors.push('Invalid block timestamp');
        }
        return result;
    }

    private validateBlockSlot(block: Block): Response<void> {
        if (block.height === 1) {
            return new Response();
        }

        const errors = [];
        const blockSlot = slotService.getSlotNumber(block.createdAt);
        const round = RoundRepository.getCurrentRound();

        if (!round) {
            errors.push(`Can't get current round`);
        }

        const generatorSlot = round.slots[block.generatorPublicKey];

        if (!generatorSlot) {
            errors.push(`GeneratorPublicKey does not exist in current round`);
        }
        if (blockSlot !== generatorSlot.slot) {
            errors.push(`Invalid block slot number: blockSlot ${blockSlot} generator slot ${generatorSlot.slot}`);
        }

        return new Response({errors});
    }

    private checkExists(block: Block): Response<void> {
        const exists: boolean = BlockRepo.isExist(block.id);
        if (exists) {
            return new Response<void>({errors: [['Block', block.id, 'already exists'].join(' ')]});
        }
        return new Response<void>();
    }

    private checkTransactionsAndApplyUnconfirmed(
        block: Block,
        checkExists: boolean,
        verify: boolean): Response<void> {
        const errors: Array<string> = [];
        let i = 0;

        while ((i < block.transactions.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
            const trs: Transaction<object> = block.transactions[i];

            if (errors.length === 0) {
                // const sender: Account = await getOrCreateAccount(trs.senderPublicKey);
                const sender: Account = AccountRepository.getByPublicKey(trs.senderPublicKey);
                // logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][sender] ${JSON.stringify(sender)}`);
                if (verify) {
                    const resultCheckTransaction: Response<void> =
                        this.checkTransaction(block, trs, sender, checkExists);
                    if (!resultCheckTransaction.success) {
                        errors.push(...resultCheckTransaction.errors);
                        logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][error] ${errors}`);
                        i--;
                        continue;
                    }
                }

                TransactionDispatcher.applyUnconfirmed(trs, sender);
                i++;
            } else {
                const sender: Account = AccountRepository.getByPublicKey(trs.senderPublicKey);
                TransactionDispatcher.undoUnconfirmed(trs, sender);
                i--;
            }
        }

        return new Response<void>({errors: errors});
    }

    private checkTransaction(
        block: Block,
        trs: Transaction<object>,
        sender: Account,
        checkExists: boolean
    ): Response<void> {
        trs.id = TransactionDispatcher.getId(trs);
        trs.blockId = block.id;

        const validateResult = TransactionDispatcher.validate(trs);
        if (!validateResult.success) {
            return new Response<void>({errors: [...validateResult.errors, 'checkTransaction']});
        }

        const verifyResult: Response<void> = TransactionDispatcher.verifyUnconfirmed(trs, sender, checkExists);
        if (!verifyResult.success) {
            return new Response<void>({errors: [...verifyResult.errors, 'checkTransaction']});
        }

        return new Response<void>();
    }

    private async applyBlock(
        block: Block,
        broadcast: boolean,
        keyPair: IKeyPair,
        saveBlock: boolean
    ): Promise<Response<void>> {
        if (keyPair) {
            const addPayloadHashResponse: Response<Block> = this.addPayloadHash(block, keyPair);
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
            await TransactionDispatcher.apply(trs, sender);
            if (saveBlock) {
                trs.blockId = block.id;
                TransactionRepo.add(trs);
            }
        }
        if (errors.length) {
            return new Response<void>({errors: [...errors, 'applyBlock']});
        }

        if (saveBlock) {
            const afterSaveResponse: Response<void> = this.afterSave(block);
            if (!afterSaveResponse.success) {
                return new Response<void>({errors: [...afterSaveResponse.errors, 'applyBlock']});
            }
            const trsLength = block.transactions.length;
            logger.debug(`[Service][Block][applyBlock] block ${block.id}, height: ${block.height}, ` +
                `applied with ${trsLength} transactions`
            );
        }

        BlockRepo.setLastBlock(block);
        // messageON('NEW_BLOCKS', block);

        if (broadcast) {
            SyncService.sendNewBlock(block);
        }

        return new Response<void>();
    }

    public addPayloadHash(block: Block, keyPair: IKeyPair): Response<Block> {
        const payloadHash = crypto.createHash('sha256');
        for (let i = 0; i < block.transactions.length; i++) {
            const transaction = block.transactions[i];
            const bytes = TransactionDispatcher.getBytes(transaction);

            block.fee += transaction.fee;
            if (transaction.type === TransactionType.SEND) {
                const asset: IAssetTransfer = <IAssetTransfer>transaction.asset;
                block.amount += asset.amount;
            }
            payloadHash.update(bytes);
        }

        block.payloadHash = payloadHash.digest().toString('hex');

        const signResponseEntity = this.sign(block, keyPair);
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

    private afterSave(block: Block): Response<void> {
        messageON('transactionsSaved', block.transactions);
        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            // how can I call this method in case it exists in service but connection service=service is baned
            const afterSaveResponse: Response<void> = TransactionDispatcher.afterSave(trs);
            if (!afterSaveResponse.success) {
                errors.push(...afterSaveResponse.errors);
                logger.error(`[Chain][afterSave]: ${JSON.stringify(afterSaveResponse.errors)}`);
            }
        }
        return new Response<void>({errors});
    }

    public async receiveBlock(block: Block): Promise<Response<void>> {
        logger.info(
            `Received new block id: ${block.id}` +
            `height: ${block.height}` +
            `round: ${RoundService.calcRound(block.height)}` +
            `slot: ${slotService.getSlotNumber(block.createdAt)}`
        );

        const removedTransactionsResponse: Response<Array<Transaction<object>>> =
            await TransactionPool.batchRemove(block.transactions, true);
        if (!removedTransactionsResponse.success) {
            return new Response<void>({errors: [...removedTransactionsResponse.errors, 'receiveBlock']});
        }
        logger.debug(
            `[Process][newReceiveBlock] removedTransactions ${JSON.stringify(removedTransactionsResponse.data)}`
        );
        const removedTransactions: Array<Transaction<object>> = removedTransactionsResponse.data || [];

        const errors: Array<string> = [];
        const processBlockResponse: Response<void> = await this.process(block, false, true, null, false);
        if (!processBlockResponse.success) {
            errors.push(...processBlockResponse.errors);
        }
        const transactionForReturn: Array<Transaction<object>> = [];
        removedTransactions.forEach((removedTrs) => {
            if (!(block.transactions.find(trs => trs.id === removedTrs.id))) {
                transactionForReturn.push(removedTrs);
            }
        });

        this.pushInPool(transactionForReturn);
        TransactionDispatcher.returnToQueueConflictedTransactionFromPool(block.transactions);

        if (errors.length) {
            this.pushInPool(removedTransactions);
            logger.error(`[Process][newReceiveBlock] ${JSON.stringify(errors)}`);
        }
        return new Response<void>({errors});
    }


    // private validateBlockSlot(block: Block, lastBlock: Block): Response<void> {
    //     const roundNextBlock = RoundService.calcRound(block.height);
    //     const roundLastBlock = RoundService.calcRound(lastBlock.height);
    //     const activeDelegates = config.constants.activeDelegates;
    //
    //     const errors: Array<string> = [];
    //     const validateBlockSlotAgainstPreviousRoundresponse: Response<void> =
    //         this.delegateService.validateBlockSlotAgainstPreviousRound(block);
    //     if (!validateBlockSlotAgainstPreviousRoundresponse.success) {
    //         errors.push(...validateBlockSlotAgainstPreviousRoundresponse.errors);
    //     }
    //     const validateBlockSlot: Response<void> = this.delegateService.validateBlockSlot(block);
    //     if (!validateBlockSlot.success) {
    //         errors.push(...validateBlockSlot.errors);
    //     }
    //     return new Response<void>({errors});
    // }
    //
    // private verifyAgainstLastNBlockIds(block: Block, result: IVerifyResult): IVerifyResult {
    //     if (BlockRepo.getLastNBlockIds().indexOf(block.id) !== -1) {
    //         result.errors.push('Block already exists in chain');
    //     }
    //     return result;
    // }
    //
    // private verifyBlockSlotWindow(block: Block, result: IVerifyResult): IVerifyResult {
    //     const currentApplicationSlot = slotService.getSlotNumber();
    //     const blockSlot = slotService.getSlotNumber(block.createdAt);
    //
    //     // Reject block if it's slot is older than BLOCK_SLOT_WINDOW
    //     if (currentApplicationSlot - blockSlot > config.constants.blockSlotWindow) {
    //         result.errors.push('Block slot is too old');
    //     }
    //
    //     // Reject block if it's slot is in the future
    //     if (currentApplicationSlot < blockSlot) {
    //         result.errors.push('Block slot is in the future');
    //     }
    //
    //     return result;
    // }

    public async deleteLastBlock(): Promise<Response<Block>> {
        let lastBlock = BlockRepo.getLastBlock();
        logger.warn(`Deleting last block: ${lastBlock.id}, height: ${lastBlock.height}`);
        if (lastBlock.height === 1) {
            return new Response<Block>({errors: ['Cannot delete genesis block']});
        }
        
        const errors: Array<string> = [];
        for (const transaction of lastBlock.transactions.reverse()) {
            const sender = AccountRepo.getByAddress(transaction.senderAddress);
            await TransactionDispatcher.undo(transaction, sender);
            TransactionDispatcher.undoUnconfirmed(transaction, sender);
        }

        if (errors.length) {
            return new Response<Block>({ errors });
        }

        RoundService.rollBack(); // (oldLastBlock, previousBlock);
        const newLastBlock = BlockRepo.deleteLastBlock();
        
        return new Response<Block>({ data: newLastBlock });
    }

    // called from app.js
    public async saveGenesisBlock(): Promise<Response<void>> {
        const exists: boolean = BlockRepo.isExist(config.genesisBlock.id);
        if (!exists) {
            return await this.applyGenesisBlock(config.genesisBlock, false, true);
        }
    }

    public async applyGenesisBlock(
        rawBlock: {[key: string]: any},
        verify: boolean = false,
        save?: boolean
    ): Promise<Response<void>> {
        rawBlock.transactions.forEach((rawTrs) => {
            const address = getAddressByPublicKey(rawTrs.sender_public_key);
            const publicKey = rawTrs.sender_public_key;
            AccountRepo.add({ publicKey: publicKey, address: address});
        });
        const resultTransactions = rawBlock.transactions.map((transaction) => {
            return TransactionPGRepo.deserialize(transaction);
        });
        rawBlock.transactions = <Array<Transaction<IAsset>>>resultTransactions;
        const block = new Block({...rawBlock, createdAt: 0, previousBlockId: null});
        await BlockPGRepo.saveOrUpdate(block);
        block.transactions = block.transactions.sort(transactionSortFunc);
        return await this.process(block, false, save, null, verify);
    }

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

            const processResponse: Response<void> = await this.process(block, false, false, null, verify);
            if (!processResponse.success) {
                errors.push(...processResponse.errors, 'loadBlocksOffset');
            }
        });
        return new Response<Block>({data: BlockRepo.getLastBlock(), errors});
    }

    public create({ transactions, timestamp, previousBlock, keyPair }): Block {
        const blockTransactions = transactions.sort(transactionSortFunc);
        return new Block({
            createdAt: timestamp,
            transactionCount: blockTransactions.length,
            previousBlockId: previousBlock.id,
            generatorPublicKey: keyPair.publicKey.toString('hex'),
            transactions: blockTransactions
        });
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

    // @deprecate
    // public async loadBlocks(blocks: Array<Block>): Promise<void> {
    //     for (let block of blocks) {
    //         await this.receiveBlock(block);
    //     }
    //     return;
    // }

    public validate(block: BlockModel): Response<void> {
        const isValid: boolean = validator.validate(block, blockSchema);
        if (!isValid) {
            return new Response<void>({
                errors: validator.getLastErrors().map(err => err.message),
            });
        }

        return new Response();
    }
}

export default new BlockService();
