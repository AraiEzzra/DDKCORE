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
import { ResponseEntity } from 'shared/model/response';
import { messageON } from 'shared/util/bus';
import config from 'shared/util/config';
import SyncService from 'core/service/sync';
import system from 'core/repository/system';
import { getAddressByPublicKey } from 'shared/util/account';
import { calculateRoundByTimestamp } from 'core/util/round';

const validator: Validator = new ZSchema({});

interface IKeyPair {
    privateKey: string;
    publicKey: string;
}

class BlockService {

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

    public async generateBlock(keyPair: IKeyPair, timestamp: number): Promise<ResponseEntity<void>> {
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

        const processBlockResponse: ResponseEntity<void> = await this.process(block, true, keyPair, false);
        if (!processBlockResponse.success) {
            TransactionDispatcher.returnToQueueConflictedTransactionFromPool(transactions);

            processBlockResponse.errors.push('[Process][newGenerateBlock] generate block');
            return processBlockResponse;
        }

        this.unlockTransactionPoolAndQueue();

        return new ResponseEntity<void>();
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
        keyPair: IKeyPair,
        verify: boolean = true
    ): Promise<ResponseEntity<void>> {

        if (verify) {
            const resultVerifyBlock: ResponseEntity<void> = this.verifyBlock(block, !keyPair);
            if (!resultVerifyBlock.success) {
                return new ResponseEntity<void>({errors: [...resultVerifyBlock.errors, 'processBlock']});
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

        const resultCheckExists: ResponseEntity<void> = this.checkExists(block);
        if (!resultCheckExists.success) {
            return new ResponseEntity<void>({errors: [...resultCheckExists.errors, 'processBlock']});
        }

        const resultCheckTransactions: ResponseEntity<void> =
            this.checkTransactionsAndApplyUnconfirmed(block, verify);
        if (!resultCheckTransactions.success) {
            return new ResponseEntity<void>({errors: [...resultCheckTransactions.errors, 'processBlock']});
        }

        const applyBlockResponse: ResponseEntity<void> = await this.applyBlock(block, broadcast, keyPair);
        if (!applyBlockResponse.success) {
            return new ResponseEntity<void>({errors: [...applyBlockResponse.errors, 'processBlock']});
        }

        TransactionQueue.reshuffle();
        return new ResponseEntity<void>();
    }

    public verifyBlock(block: Block, verify: boolean): ResponseEntity<void> {
        const lastBlock: Block = BlockRepo.getLastBlock();

        let errors: Array<string> = [];

        if (verify) {
            this.verifySignature(block, errors);
        }

        this.verifyPreviousBlock(block, errors);
        this.verifyVersion(block, errors);
        // TODO: validate total fee

        if (verify) {
            this.verifyId(block, errors);
            this.verifyPayload(block, errors);
        }

        this.verifyBlockSlot(block, lastBlock, errors);

        const response = new ResponseEntity<void>({ errors: errors.reverse() });

        if (response.success) {
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
                JSON.stringify(response.errors)
            );
        }
        return response;
    }

    private setHeight(block: Block, lastBlock: Block): Block {
        block.height = lastBlock.height + 1;
        return block;
    }

    private verifySignature(block: Block, errors: Array<string>): void {
        let valid: boolean = false;
        const hash = crypto.createHash('sha256').update(this.getBytes(block)).digest();
        const blockSignatureBuffer = Buffer.from(block.signature, 'hex');
        const generatorPublicKeyBuffer = Buffer.from(block.generatorPublicKey, 'hex');

        try {
            valid = sodium.crypto_sign_verify_detached(blockSignatureBuffer, hash, generatorPublicKeyBuffer);
        } catch (e) {
            errors.push(e.toString());
        }

        if (!valid) {
            errors.push('Failed to validate block signature');
        }
    }

    private verifyPreviousBlock(block: Block, errors: Array<string>): void {
        if (!block.previousBlockId && block.height !== 1) {
            errors.push('Invalid previous block');
        }
    }

    private verifyVersion(block: Block, errors: Array<string>): void {
        const version: number = block.version;
        if (version !== this.currentBlockVersion) {
            errors.push('Invalid block version',
                'No exceptions found. Block version doesn\'t match te current one.');
        }
    }

    private verifyId(block: Block, errors: Array<string>): void {
        const idResponse: ResponseEntity<string> = this.getId(block);
        if (!idResponse.success) {
            errors.push(...idResponse.errors);
            return;
        }
        const blockId: string = idResponse.data;
        if (block.id !== blockId) {
            errors.push(`Block id is corrupted expected: ${blockId} actual: ${block.id}`);
        }
    }

    private getId(block: Block): ResponseEntity<string> {
        let id: string = null;
        try {
            id = crypto.createHash('sha256').update(this.getBytes(block)).digest('hex');
        } catch (err) {
            return new ResponseEntity<string>({errors: [err, 'getId']});
        }
        return new ResponseEntity<string>({data: id});
    }

    private verifyPayload(block: Block, errors: Array<string>): void {
        if (block.transactions.length !== block.transactionCount) {
            errors.push('Included transactions do not match block transactions count');
        }

        if (block.transactions.length > config.constants.maxTxsPerBlock) {
            errors.push('Number of transactions exceeds maximum per block');
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
                errors.push(e.toString());
            }

            if (appliedTransactions[trs.id]) {
                errors.push(`Encountered duplicate transaction: ${trs.id}`);
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
            errors.push('Invalid payload hash');
        }

        if (totalAmount !== block.amount) {
            errors.push('Invalid total amount');
        }

        if (totalFee !== block.fee) {
            errors.push(`Invalid total fee. Expected: ${totalFee}, actual: ${block.fee}`);
        }
    }

    private verifyBlockSlot(block: Block, lastBlock: Block, errors: Array<string>): void {
        const blockSlotNumber = slotService.getSlotNumber(block.createdAt);
        const lastBlockSlotNumber = slotService.getSlotNumber(lastBlock.createdAt);

        if (blockSlotNumber > slotService.getSlotNumber() || blockSlotNumber <= lastBlockSlotNumber) {
            errors.push('Invalid block timestamp');
        }
    }

    private validateBlockSlot(block: Block): ResponseEntity<void> {
        if (block.height === 1) {
            return new ResponseEntity();
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

        return new ResponseEntity<void>({errors});
    }

    private checkExists(block: Block): ResponseEntity<void> {
        const exists: boolean = BlockRepo.isExist(block.id);
        if (exists) {
            return new ResponseEntity<void>({errors: [['Block', block.id, 'already exists'].join(' ')]});
        }
        return new ResponseEntity<void>();
    }

    private checkTransactionsAndApplyUnconfirmed(block: Block, verify: boolean): ResponseEntity<void> {
        const errors: Array<string> = [];
        let i = 0;

        while ((i < block.transactions.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
            const trs: Transaction<object> = block.transactions[i];

            if (errors.length === 0) {

                trs.senderAddress = trs.senderAddress ? trs.senderAddress : getAddressByPublicKey(trs.senderPublicKey);
                const sender: Account = AccountRepository.getByAddress(trs.senderAddress);
                if (!sender) {
                    AccountRepo.add({
                        publicKey: trs.senderPublicKey,
                        address: trs.senderAddress
                    });
                } else {
                    sender.secondPublicKey = trs.senderPublicKey;
                }

                if (verify) {
                    const resultCheckTransaction: ResponseEntity<void> =
                        this.checkTransaction(block, trs, sender);
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

        return new ResponseEntity<void>({errors: errors});
    }

    private checkTransaction(block: Block, trs: Transaction<object>, sender: Account): ResponseEntity<void> {
        trs.id = TransactionDispatcher.getId(trs);
        trs.blockId = block.id;

        const validateResult = TransactionDispatcher.validate(trs);
        if (!validateResult.success) {
            return new ResponseEntity<void>({errors: [...validateResult.errors, 'checkTransaction']});
        }

        const verifyResult: ResponseEntity<void> = TransactionDispatcher.verifyUnconfirmed(trs, sender);
        if (!verifyResult.success) {
            return new ResponseEntity<void>({errors: [...verifyResult.errors, 'checkTransaction']});
        }

        return new ResponseEntity<void>();
    }

    private async applyBlock(
        block: Block,
        broadcast: boolean,
        keyPair: IKeyPair,
    ): Promise<ResponseEntity<void>> {
        if (keyPair) {
            const addPayloadHashResponse: ResponseEntity<Block> = this.addPayloadHash(block, keyPair);
            if (!addPayloadHashResponse.success) {
                return new ResponseEntity<void>({errors: [...addPayloadHashResponse.errors, 'applyBlock']});
            }
            block = addPayloadHashResponse.data;
        }

        BlockRepo.add(block);
        await BlockPGRepo.saveOrUpdate(block);

        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            const sender = AccountRepo.getByPublicKey(trs.senderPublicKey);
            trs.blockId = block.id;
            await TransactionDispatcher.apply(trs, sender);
            TransactionRepo.add(trs);
        }
        if (errors.length) {
            return new ResponseEntity<void>({errors: [...errors, 'applyBlock']});
        }

        const afterSaveResponse: ResponseEntity<void> = this.afterSave(block);
        if (!afterSaveResponse.success) {
            return new ResponseEntity<void>({errors: [...afterSaveResponse.errors, 'applyBlock']});
        }
        const trsLength = block.transactions.length;
        logger.debug(`[Service][Block][applyBlock] block ${block.id}, height: ${block.height}, ` +
            `applied with ${trsLength} transactions`
        );

        if (broadcast) {
            SyncService.sendNewBlock(block);
        }

        return new ResponseEntity<void>();
    }

    public addPayloadHash(block: Block, keyPair: IKeyPair): ResponseEntity<Block> {
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
            return new ResponseEntity<Block>({ errors: [...signResponseEntity.errors, 'addPayloadHash'] });
        }

        block.signature = signResponseEntity.data;
        const idResponse: ResponseEntity<string> = this.getId(block);
        if (!idResponse.success) {
            return new ResponseEntity<Block>({errors: [...idResponse.errors, 'addPayloadHash']});
        }
        block.id = idResponse.data;
        return new ResponseEntity<Block>({data: block});
    }

    private afterSave(block: Block): ResponseEntity<void> {
        messageON('transactionsSaved', block.transactions);
        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            const afterSaveResponse: ResponseEntity<void> = TransactionDispatcher.afterSave(trs);
            if (!afterSaveResponse.success) {
                errors.push(...afterSaveResponse.errors);
                logger.error(`[Chain][afterSave]: ${JSON.stringify(afterSaveResponse.errors)}`);
            }
        }
        return new ResponseEntity<void>({errors});
    }

    public async receiveBlock(block: Block): Promise<ResponseEntity<void>> {
        logger.info(
            `Received new block id: ${block.id} ` +
            `height: ${block.height} ` +
            `round: ${calculateRoundByTimestamp(block.createdAt)} ` +
            `slot: ${slotService.getSlotNumber(block.createdAt)}`
        );

        const removedTransactionsResponse: ResponseEntity<Array<Transaction<object>>> =
            await TransactionPool.batchRemove(block.transactions, true);
        if (!removedTransactionsResponse.success) {
            return new ResponseEntity<void>({errors: [...removedTransactionsResponse.errors, 'receiveBlock']});
        }
        logger.debug(
            `[Process][newReceiveBlock] removedTransactions ${JSON.stringify(removedTransactionsResponse.data)}`
        );
        const removedTransactions: Array<Transaction<object>> = removedTransactionsResponse.data || [];

        const errors: Array<string> = [];
        const processBlockResponse: ResponseEntity<void> = await this.process(block, false, null, false);
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
        return new ResponseEntity<void>({errors});
    }


    // private validateBlockSlot(block: Block, lastBlock: Block): ResponseEntity<void> {
    //     const roundNextBlock = calculateRoundByTimestamp(block.createdAt);
    //     const roundLastBlock = calculateRoundByTimestamp(lastBlock.createdAt);
    //     const activeDelegates = config.constants.activeDelegates;
    //
    //     const errors: Array<string> = [];
    //     const validateBlockSlotAgainstPreviousRoundresponse: ResponseEntity<void> =
    //         this.delegateService.validateBlockSlotAgainstPreviousRound(block);
    //     if (!validateBlockSlotAgainstPreviousRoundresponse.success) {
    //         errors.push(...validateBlockSlotAgainstPreviousRoundresponse.errors);
    //     }
    //     const validateBlockSlot: ResponseEntity<void> = this.delegateService.validateBlockSlot(block);
    //     if (!validateBlockSlot.success) {
    //         errors.push(...validateBlockSlot.errors);
    //     }
    //     return new ResponseEntity<void>({errors});
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

    public async deleteLastBlock(): Promise<ResponseEntity<Block>> {
        let lastBlock = BlockRepo.getLastBlock();
        logger.warn(`Deleting last block: ${lastBlock.id}, height: ${lastBlock.height}`);
        if (lastBlock.height === 1) {
            return new ResponseEntity<Block>({errors: ['Cannot delete genesis block']});
        }

        const errors: Array<string> = [];
        for (const transaction of lastBlock.transactions.reverse()) {
            const sender = AccountRepo.getByAddress(transaction.senderAddress);
            await TransactionDispatcher.undo(transaction, sender);
            TransactionDispatcher.undoUnconfirmed(transaction, sender);
        }

        if (errors.length) {
            return new ResponseEntity<Block>({ errors });
        }

        RoundService.rollBack(); // (oldLastBlock, previousBlock);
        const newLastBlock = BlockRepo.deleteLastBlock();

        return new ResponseEntity<Block>({ data: newLastBlock });
    }

    public async applyGenesisBlock(rawBlock: BlockModel): Promise<ResponseEntity<void>> {
        rawBlock.transactions.forEach((rawTrs) => {
            const address = getAddressByPublicKey(rawTrs.senderPublicKey);
            const publicKey = rawTrs.senderPublicKey;
            AccountRepo.add({ publicKey: publicKey, address: address});
        });
        const resultTransactions = rawBlock.transactions.map((transaction) =>
            TransactionRepo.deserialize(transaction)
        );
        rawBlock.transactions = <Array<Transaction<IAsset>>>resultTransactions;
        const block = new Block({ ...rawBlock, createdAt: 0, previousBlockId: null });
        block.transactions = block.transactions.sort(transactionSortFunc);
        return await this.process(block, false,  null, false);
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

    private sign(block, keyPair): ResponseEntity<string> {
        const blockHash = this.getHash(block);
        if (!blockHash.success) {
            return new ResponseEntity<string>({ errors: [...blockHash.errors, 'sign'] });
        }

        const sig = Buffer.alloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(sig, blockHash.data, keyPair.privateKey);
        return new ResponseEntity<string>({ data: sig.toString('hex') });
    }

    private getHash(block: Block): ResponseEntity<Buffer> {
        let hash: Buffer = null;
        try {
            hash = crypto.createHash('sha256').update(this.getBytes(block)).digest();
        } catch (err) {
            return new ResponseEntity<Buffer>({errors: [err, 'getHash']});
        }
        return new ResponseEntity<Buffer>({data: hash});
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

    public validate(block: BlockModel): ResponseEntity<void> {
        const isValid: boolean = validator.validate(block, blockSchema);
        if (!isValid) {
            return new ResponseEntity<void>({
                errors: validator.getLastErrors().map(err => err.message),
            });
        }

        return new ResponseEntity<void>();
    }
}

export default new BlockService();
