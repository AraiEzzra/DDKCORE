import * as crypto from 'crypto';
import * as sodium from 'sodium-javascript';
import BUFFER from 'core/util/buffer';

import Validator from 'z-schema';
import ZSchema from 'shared/validate/z_schema';
import { logger } from 'shared/util/logger';
import { Account } from 'shared/model/account';
import { Block, BlockModel } from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import SharedTransactionRepo from 'shared/repository/transaction';
import BlockPGRepo from 'core/repository/block/pg';
import AccountRepo from 'core/repository/account';
import AccountRepository from 'core/repository/account';
import { IAsset, IAssetTransfer, Transaction, TransactionType } from 'shared/model/transaction';
import TransactionDispatcher from 'core/service/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionPool from 'core/service/transactionPool';
import TransactionRepo from 'core/repository/transaction/';
import SlotService from 'core/service/slot';
import RoundRepository from 'core/repository/round';
import RoundService from 'core/service/round';
import { transactionSortFunc } from 'core/util/transaction';
import blockSchema from 'core/schema/block';
import { ResponseEntity } from 'shared/model/response';
import { messageON } from 'shared/util/bus';
import config from 'shared/config';
import SyncService from 'core/service/sync';
import { getAddressByPublicKey } from 'shared/util/account';
import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import { MIN_ROUND_BLOCK } from 'core/util/block';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import { IKeyPair, ed } from 'shared/util/ed';

const validator: Validator = new ZSchema({});

class BlockService {
    private readonly currentBlockVersion: number = config.CONSTANTS.FORGING.CURRENT_BLOCK_VERSION;
    private readonly BLOCK_BUFFER_SIZE
        = BUFFER.LENGTH.UINT32 // version
        + BUFFER.LENGTH.INT64 // timestamp
        + BUFFER.LENGTH.UINT32 // transactionCount
        + BUFFER.LENGTH.INT64 // amount
        + BUFFER.LENGTH.INT64 // fee
    ;

    public async generateBlock(keyPair: IKeyPair, timestamp: number): Promise<ResponseEntity<void>> {
        logger.debug(`[Service][Block][generateBlock] timestamp ${timestamp}`);
        this.lockTransactionPoolAndQueue();

        const transactions: Array<Transaction<object>> =
            TransactionPool.popSortedUnconfirmedTransactions(config.CONSTANTS.MAX_TRANSACTIONS_PER_BLOCK);

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
                return new ResponseEntity<void>({ errors: [...resultVerifyBlock.errors, 'process'] });
            }

            const validationResponse = this.validateBlockSlot(block);
            if (!validationResponse.success) {
                return new ResponseEntity<void>({ errors: [...validationResponse.errors, 'process'] });
            }
        } else {
            // TODO: remove when validate will be fix
            if (keyPair) {
                const lastBlock: Block = BlockRepo.getLastBlock();
                block = this.setHeight(block, lastBlock);
            }
        }

        const resultCheckExists: ResponseEntity<void> = this.checkExists(block);
        if (!resultCheckExists.success) {
            return new ResponseEntity<void>({ errors: [...resultCheckExists.errors, 'process'] });
        }

        const resultCheckTransactions: ResponseEntity<void> =
            this.checkTransactionsAndApplyUnconfirmed(block, verify);
        if (!resultCheckTransactions.success) {
            return new ResponseEntity<void>({ errors: [...resultCheckTransactions.errors, 'process'] });
        }

        const applyBlockResponse: ResponseEntity<void> = await this.applyBlock(block, broadcast, keyPair);
        if (!applyBlockResponse.success) {
            return new ResponseEntity<void>({ errors: [...applyBlockResponse.errors, 'process'] });
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

    public setHeight(block: Block, lastBlock: Block): Block {
        block.height = lastBlock.height + 1;
        return block;
    }

    private verifySignature(block: Block, errors: Array<string>): void {
        let valid: boolean = false;
        const hash = this.getHash(block, true);
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
        const id: string = this.getId(block);
        if (block.id !== id) {
            errors.push(`Block id is corrupted expected: ${id} actual: ${block.id}`);
        }
    }

    private getId(block: Block): string {
        return this.getHash(block, false).toString('hex');
    }

    private verifyPayload(block: Block, errors: Array<string>): void {
        if (block.transactions.length !== block.transactionCount) {
            errors.push('Included transactions do not match block transactions count');
        }

        if (block.transactions.length > config.CONSTANTS.MAX_TRANSACTIONS_PER_BLOCK) {
            errors.push('Number of transactions exceeds maximum per block');
        }

        let totalAmount = 0;
        let totalFee = 0;
        const payloadHash = crypto.createHash('sha256');
        const appliedTransactions = {};

        for (const trs of block.transactions) {
            let bytes: Buffer;

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
        const blockSlotNumber = SlotService.getSlotNumber(block.createdAt);
        const lastBlockSlotNumber = SlotService.getSlotNumber(lastBlock.createdAt);

        if (blockSlotNumber > SlotService.getSlotNumber() || blockSlotNumber <= lastBlockSlotNumber) {
            errors.push('Invalid block timestamp');
        }
    }

    private validateBlockSlot(block: Block): ResponseEntity<void> {
        if (block.height === 1) {
            return new ResponseEntity<void>();
        }

        const blockSlot = SlotService.getSlotNumber(block.createdAt);
        logger.debug(`[Service][Block][validateBlockSlot]: blockSlot ${blockSlot}`);

        let currentRound = RoundRepository.getCurrentRound();
        logger.debug(`[Service][Block][validateBlockSlot]: round ${currentRound}`);

        const generatorSlot = currentRound.slots[block.generatorPublicKey];

        if (!generatorSlot) {
            return new ResponseEntity<void>({ errors: ['GeneratorPublicKey does not exist in current round'] });
        }

        if (blockSlot !== generatorSlot.slot) {
            return new ResponseEntity<void>(
                { errors: [`blockSlot: ${blockSlot} not equal with generatorSlot: ${generatorSlot.slot}`] }
            );
        }

        return new ResponseEntity<void>({});
    }

    private checkExists(block: Block): ResponseEntity<void> {
        const exists: boolean = BlockRepo.isExist(block.id);
        if (exists) {
            return new ResponseEntity<void>({ errors: [['Block', block.id, 'already exists'].join(' ')] });
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
                let sender: Account = AccountRepository.getByAddress(trs.senderAddress);
                if (!sender) {
                    sender = AccountRepo.add({
                        publicKey: trs.senderPublicKey,
                        address: trs.senderAddress
                    });
                } else {
                    sender.publicKey = trs.senderPublicKey;
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

        return new ResponseEntity<void>({ errors: errors });
    }

    private checkTransaction(block: Block, trs: Transaction<object>, sender: Account): ResponseEntity<void> {
        trs.id = TransactionDispatcher.getId(trs);
        trs.blockId = block.id;

        const validateResult = TransactionDispatcher.validate(trs);
        if (!validateResult.success) {
            return new ResponseEntity<void>({ errors: [...validateResult.errors, 'checkTransaction'] });
        }

        const verifyResult: ResponseEntity<void> = TransactionDispatcher.verifyUnconfirmed(trs, sender);
        if (!verifyResult.success) {
            return new ResponseEntity<void>({ errors: [...verifyResult.errors, 'checkTransaction'] });
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
                return new ResponseEntity<void>({ errors: [...addPayloadHashResponse.errors, 'applyBlock'] });
            }
            block = addPayloadHashResponse.data;
        }

        BlockRepo.add(block);
        await BlockPGRepo.saveOrUpdate(block);

        if (block.height >= MIN_ROUND_BLOCK) {
            RoundRepository.getCurrentRound().slots[block.generatorPublicKey].isForged = true;
        }

        const errors: Array<string> = [];
        for (const trs of block.transactions) {
            const sender = AccountRepo.getByPublicKey(trs.senderPublicKey);
            trs.blockId = block.id;
            await TransactionDispatcher.apply(trs, sender);
            TransactionRepo.add(trs);
        }
        if (errors.length) {
            return new ResponseEntity<void>({ errors: [...errors, 'applyBlock'] });
        }

        const afterSaveResponse: ResponseEntity<void> = this.afterSave(block);
        if (!afterSaveResponse.success) {
            return new ResponseEntity<void>({ errors: [...afterSaveResponse.errors, 'applyBlock'] });
        }
        const trsLength = block.transactions.length;
        logger.debug(`[Service][Block][applyBlock] block ${block.id}, height: ${block.height}, ` +
            `applied with ${trsLength} transactions`
        );

        if (broadcast) {
            SyncService.sendNewBlock(block);

            const serializedBlock: Block & { transactions: any } = block.getCopy();
            serializedBlock.transactions = block.transactions.map(trs => SharedTransactionRepo.serialize(trs));
            SocketMiddleware.emitEvent<Block>(EVENT_TYPES.APPLY_BLOCK, serializedBlock);
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
        block.signature = this.calculateSignature(block, keyPair);
        block.id = this.getId(block);

        return new ResponseEntity<Block>({ data: block });
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
        return new ResponseEntity<void>({ errors });
    }

    public async receiveBlock(block: Block): Promise<ResponseEntity<void>> {
        logger.info(
            `Received new block id: ${block.id} ` +
            `height: ${block.height} ` +
            `slot: ${SlotService.getSlotNumber(block.createdAt)}`
        );

        const removedTransactionsResponse: ResponseEntity<Array<Transaction<object>>> =
            TransactionPool.batchRemove(block.transactions, true);
        if (!removedTransactionsResponse.success) {
            return new ResponseEntity<void>({ errors: [...removedTransactionsResponse.errors, 'receiveBlock'] });
        }
        logger.debug(
            `[Process][newReceiveBlock] removed transactions count: ${removedTransactionsResponse.data.length}`
        );
        const removedTransactions: Array<Transaction<object>> = removedTransactionsResponse.data || [];

        const errors: Array<string> = [];
        const processBlockResponse: ResponseEntity<void> = await this.process(block, true, null, true);
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
        return new ResponseEntity<void>({ errors });
    }

    public async deleteLastBlock(): Promise<ResponseEntity<Block>> {
        let lastBlock = BlockRepo.getLastBlock();
        logger.warn(`Deleting last block: ${lastBlock.id}, height: ${lastBlock.height}`);
        if (lastBlock.height === 1) {
            return new ResponseEntity<Block>({ errors: ['Cannot delete genesis block'] });
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

        await BlockPGRepo.deleteById(lastBlock.id);
        const newLastBlock = BlockRepo.deleteLastBlock();

        const serializedBlock: Block & { transactions: any } = lastBlock.getCopy();
        serializedBlock.transactions = lastBlock.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        SocketMiddleware.emitEvent<Block>(EVENT_TYPES.UNDO_BLOCK, serializedBlock);

        return new ResponseEntity<Block>({ data: newLastBlock });
    }

    public async applyGenesisBlock(rawBlock: BlockModel): Promise<ResponseEntity<void>> {
        rawBlock.transactions.forEach((rawTrs) => {
            const address = getAddressByPublicKey(rawTrs.senderPublicKey);
            const publicKey = rawTrs.senderPublicKey;
            AccountRepo.add({ publicKey: publicKey, address: address });
        });
        const resultTransactions = rawBlock.transactions.map((transaction) =>
            SharedTransactionRepo.deserialize(transaction)
        );
        rawBlock.transactions = <Array<Transaction<IAsset>>>resultTransactions;
        const block = new Block({ ...rawBlock, createdAt: 0, previousBlockId: null });
        block.transactions = block.transactions.sort(transactionSortFunc);
        return await this.process(block, false, null, false);
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

    private calculateSignature(block: Block, keyPair: IKeyPair): string {
        const blockHash = this.getHash(block, true);
        const signature = Buffer.alloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(signature, blockHash, keyPair.privateKey);
        return signature.toString('hex');
    }

    private getHash(block: Block, skipSignature: boolean = false): Buffer {
        return crypto.createHash('sha256').update(this.getBytes(block, skipSignature)).digest();
    }

    private getBytes(block: Block, skipSignature: boolean = false): Buffer {
        const buf = Buffer.alloc(this.BLOCK_BUFFER_SIZE);
        let offset = 0;

        offset = BUFFER.writeInt32LE(buf, block.version, offset);
        offset = BUFFER.writeInt32LE(buf, block.createdAt, offset);
        offset = BUFFER.writeInt32LE(buf, block.transactionCount, offset);
        offset = BUFFER.writeUInt64LE(buf, block.amount, offset);
        BUFFER.writeUInt64LE(buf, block.fee, offset);

        return Buffer.concat([
            buf,
            Buffer.from(block.previousBlockId ? block.previousBlockId : '', 'hex'),
            Buffer.from(block.payloadHash, 'hex'),
            Buffer.from(block.generatorPublicKey, 'hex'),
            Buffer.from(!skipSignature && block.signature ? block.signature : '', 'hex'),
        ]);
    }

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
