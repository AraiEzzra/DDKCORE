import * as crypto from 'crypto';
import * as sodium from 'sodium-native';
import BUFFER from 'core/util/buffer';

import Validator from 'z-schema';
import ZSchema from 'shared/validate/z_schema';
import { logger } from 'shared/util/logger';
import { Account } from 'shared/model/account';
import { Block, BlockModel, SerializedBlock } from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import SharedTransactionRepo from 'shared/repository/transaction';
import BlockPGRepo from 'core/repository/block/pg';
import AccountRepo from 'core/repository/account';
import AccountRepository from 'core/repository/account';
import {
    BlockLifecycle,
    IAsset,
    IAssetTransfer,
    Transaction,
    TransactionLifecycle,
    TransactionType
} from 'shared/model/transaction';
import TransactionDispatcher from 'core/service/transaction';
import TransactionService from 'core/service/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionPool from 'core/service/transactionPool';
import SlotService from 'core/service/slot';
import RoundRepository from 'core/repository/round';
import { transactionSortFunc } from 'core/util/transaction';
import blockSchema from 'core/schema/block';
import { ResponseEntity } from 'shared/model/response';
import config from 'shared/config';
import SyncService from 'core/service/sync';
import { getAddressByPublicKey } from 'shared/util/account';
import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import {
    isBlockCanBeProcessed,
    isEqualHeight,
    isEqualId,
    isEqualPreviousBlock,
    isGreatestHeight,
    isLessHeight,
    isNewer,
    isNext,
    MIN_ROUND_BLOCK
} from 'core/util/block';
import { IKeyPair } from 'shared/util/ed';
import System from 'core/repository/system';
import BlockHistoryRepository from 'core/repository/history/block';
import TransactionHistoryRepository from 'core/repository/history/transaction';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import RoundService from 'core/service/round';
import DelegateRepository from 'core/repository/delegate';
import { messageON } from 'shared/util/bus';

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
        this.lockTransactionQueueProcess();

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
            this.unlockTransactionQueueProcess();
            return processBlockResponse;
        }

        this.unlockTransactionQueueProcess();

        return new ResponseEntity<void>();
    }

    private pushInPool(transactions: Array<Transaction<object>>): void {
        for (const trs of transactions) {
            const sender = AccountRepository.getByAddress(trs.senderAddress);
            const verifyResult = TransactionService.verifyUnconfirmed(trs, sender, true);
            if (verifyResult.success) {
                TransactionPool.push(trs, sender, false);
            } else {
                TransactionQueue.push(trs);
                logger.debug(
                    `[Service][Block][pushInPool] trs ${trs.id} returned to queue by error: ${verifyResult.errors}`
                );
            }
        }
    }

    private lockTransactionQueueProcess(): void {
        TransactionQueue.lock();
    }

    private unlockTransactionQueueProcess(): void {
        TransactionQueue.unlock();
        setImmediate(TransactionQueue.process);
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
        const round = RoundRepository.getCurrentRound();
        const prevRound = RoundRepository.getPrevRound();
        BlockHistoryRepository.addEvent(block, { action: BlockLifecycle.PROCESS, state: { round, prevRound } });

        if (verify) {
            BlockHistoryRepository.addEvent(block, { action: BlockLifecycle.VERIFY });
            const resultVerifyBlock: ResponseEntity<void> = this.verifyBlock(block, !keyPair);
            if (!resultVerifyBlock.success) {
                return new ResponseEntity<void>({ errors: [...resultVerifyBlock.errors, 'process'] });
            }

            const validationResponse = this.verifyBlockSlot(block);
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
            [...block.transactions]
                .reverse()
                .forEach(trs => {
                    const sender = AccountRepository.getByAddress(trs.senderAddress);
                    TransactionDispatcher.undoUnconfirmed(trs, sender);
                    TransactionHistoryRepository.addEvent(trs, { action: TransactionLifecycle.UNDO_BY_FAILED_APPLY });
                });
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

        this.verifyBlockSlotNumber(block, lastBlock, errors);

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

    public validateReceivedBlock(lastBlock: Block, receivedBlock: Block): ResponseEntity<void> {
        if (isEqualId(lastBlock, receivedBlock)) {
            return new ResponseEntity<void>({
                errors: [
                    `[validateReceivedBlock] Block already processed: ${receivedBlock.id}`
                ]
            });
        }

        if (isLessHeight(lastBlock, receivedBlock)) {
            return new ResponseEntity<void>({
                errors: [
                    `[validateReceivedBlock] received block less then last block: ${receivedBlock.id}`
                ]
            });
        }

        if (isGreatestHeight(lastBlock, receivedBlock)) {
            if (!isNext(lastBlock, receivedBlock) || !isBlockCanBeProcessed(lastBlock, receivedBlock)) {
                // TODO replace it
                if (!SyncService.getMyConsensus() && !System.synchronization) {
                    messageON('EMIT_SYNC_BLOCKS');
                }
                return new ResponseEntity<void>({
                    errors: [
                        `[validateReceivedBlock] Block not close: ${receivedBlock.id}`
                    ]
                });
            }
        }

        if (isEqualHeight(lastBlock, receivedBlock)) {
            if (
                !isNewer(lastBlock, receivedBlock) ||
                SyncService.getMyConsensus() ||
                !isEqualPreviousBlock(lastBlock, receivedBlock)
            ) {
                return new ResponseEntity<void>({
                    errors: [
                        `[validateReceivedBlock] receive not valid equal block: ${receivedBlock.id}`
                    ]
                });
            }

            const verifyEqualResponse = this.verifyEqualBlock(receivedBlock);
            if (!verifyEqualResponse.success) {
                return new ResponseEntity<void>({
                    errors: [
                        `[validateReceivedBlock] verify failed for equal block: ${receivedBlock.id}
                    errors: ${verifyEqualResponse.errors}`
                    ]
                });
            }
        }

        return new ResponseEntity<void>();
    }

    public verifyEqualBlock(receivedBlock: Block): ResponseEntity<void> {
        return new ResponseEntity<void>();
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
                bytes = TransactionDispatcher.getBytes(trs);
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

    private verifyBlockSlotNumber(receivedBlock: Block, lastBlock: Block, errors: Array<string>): void {
        const receivedBlockSlotNumber = SlotService.getSlotNumber(receivedBlock.createdAt);
        const lastBlockSlotNumber = SlotService.getSlotNumber(lastBlock.createdAt);
        const currentSlotNumber = SlotService.getSlotNumber();

        if (
            receivedBlockSlotNumber > currentSlotNumber + config.CONSTANTS.ACTIVE_DELEGATES - 1 ||
            receivedBlockSlotNumber <= lastBlockSlotNumber
        ) {
            errors.push('Invalid block timestamp');
        }
    }

    private verifyBlockSlot(block: Block): ResponseEntity<void> {
        if (block.height === 1) {
            return new ResponseEntity<void>();
        }

        const blockSlot = SlotService.getSlotNumber(block.createdAt);
        logger.trace(`[Service][Block][validateBlockSlot]: blockSlot ${blockSlot}`);

        let currentRound = RoundRepository.getCurrentRound();
        logger.trace(`[Service][Block][validateBlockSlot]: round ${JSON.stringify(currentRound)}`);

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
        const exists: boolean = BlockRepo.has(block.id);
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
                    const resultCheckTransaction: ResponseEntity<void> = this.checkTransaction(trs, sender);
                    if (!resultCheckTransaction.success) {
                        errors.push(...resultCheckTransaction.errors);
                        logger.error(
                            `[Service][Block][checkTransactionsAndApplyUnconfirmed][error] ${errors.join('. ')}. ` +
                            `Transaction id: ${trs.id}`,
                        );
                        i--;
                        continue;
                    }
                } else {
                    // recalculate vote fee before block generation
                    if (trs.type === TransactionType.VOTE) {
                        trs.fee = TransactionDispatcher.calculateFee(trs, sender);
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

    private checkTransaction(trs: Transaction<object>, sender: Account): ResponseEntity<void> {
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
        }

        const saveResult = await BlockPGRepo.batchSave(block);
        if (!saveResult.success) {
            saveResult.errors.push('applyBlock');
            return saveResult;
        }

        BlockRepo.add(block);
        BlockHistoryRepository.addEvent(block, { action: BlockLifecycle.APPLY });

        for (const trs of block.transactions) {
            const sender = AccountRepo.getByPublicKey(trs.senderPublicKey);
            TransactionDispatcher.apply(trs, sender);
        }

        logger.debug(
            `[Service][Block][applyBlock] block ${block.id}, height: ${block.height}, ` +
            `applied with ${block.transactionCount} transactions`
        );

        if (broadcast && !System.synchronization) {
            const serializedBlock = block.serialize();

            SocketMiddleware.emitEvent(EVENT_TYPES.APPLY_BLOCK, serializedBlock);
            SyncService.sendNewBlock(serializedBlock);
        }

        if (block.height >= MIN_ROUND_BLOCK) {
            RoundRepository.getCurrentRound().slots[block.generatorPublicKey].isForged = true;
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

        for (const transaction of block.transactions) {
            transaction.blockId = block.id;
        }

        const round = RoundRepository.getCurrentRound();
        const prevRound = RoundRepository.getPrevRound();
        BlockHistoryRepository.addEvent(block, { action: BlockLifecycle.CREATE, state: { round, prevRound } });

        return new ResponseEntity<Block>({ data: block });
    }

    public async receiveBlock(block: Block): Promise<ResponseEntity<void>> {
        BlockHistoryRepository.addEvent(block, { action: BlockLifecycle.RECEIVE });

        logger.info(
            `Received new block id: ${block.id} ` +
            `height: ${block.height} ` +
            `slot: ${SlotService.getSlotNumber(block.createdAt)}`
        );

        this.lockTransactionQueueProcess();

        const removedTransactions = TransactionPool.batchRemove(block.transactions);
        logger.debug(
            `[Service][Block][receiveBlock] removed transactions count: ${removedTransactions.length}`
        );

        if (!RoundRepository.getCurrentRound()) {
            const activeDelegatesCount = DelegateRepository.getActiveDelegates().length;
            const firstSlotNumber = getFirstSlotNumberInRound(block.createdAt, activeDelegatesCount);
            const newRound = RoundService.generate(firstSlotNumber);
            RoundRepository.add(newRound);
        }

        const errors: Array<string> = [];
        const processBlockResponse: ResponseEntity<void> = await this.process(block, true, null, true);
        if (!processBlockResponse.success) {
            errors.push(...processBlockResponse.errors);
        }

        if (errors.length) {
            this.pushInPool(removedTransactions);
            logger.error(`[Service][Block][receiveBlock] blockId: ${block.id} errors: ${JSON.stringify(errors)}`);
            // TODO check it
            // block.transactions.forEach(trs => {
            //     TransactionQueue.push(trs);
            // });
        } else {
            const transactionForReturn: Array<Transaction<IAsset>> = [];
            removedTransactions.forEach((removedTrs) => {
                if (!(block.transactions.find(trs => trs.id === removedTrs.id))) {
                    transactionForReturn.push(removedTrs);
                }
            });

            this.pushInPool(transactionForReturn);
            TransactionDispatcher.returnToQueueConflictedTransactionFromPool(block.transactions);
        }
        this.unlockTransactionQueueProcess();
        return new ResponseEntity<void>({ errors });
    }

    public async deleteLastBlock(): Promise<ResponseEntity<Block>> {
        let lastBlock = BlockRepo.getLastBlock();
        logger.info(`Deleting last block: ${lastBlock.id}, height: ${lastBlock.height}`);
        if (lastBlock.height === 1) {
            return new ResponseEntity<Block>({ errors: ['Cannot delete genesis block'] });
        }

        const deleteResult = await BlockPGRepo.deleteById(lastBlock.id);
        if (!deleteResult.success) {
            deleteResult.errors.push('deleteLastBlock');
            return new ResponseEntity({ errors: deleteResult.errors });
        }

        const currentRound = RoundRepository.getCurrentRound();
        currentRound.slots[lastBlock.generatorPublicKey].isForged = false;

        const newLastBlock = BlockRepo.deleteLastBlock();
        const round = RoundRepository.getCurrentRound();
        const prevRound = RoundRepository.getPrevRound();
        BlockHistoryRepository.addEvent(lastBlock, { action: BlockLifecycle.UNDO, state: { round, prevRound } });

        const reversedTransactions = [...lastBlock.transactions].reverse();
        for (const transaction of reversedTransactions) {
            const sender = AccountRepo.getByAddress(transaction.senderAddress);
            TransactionDispatcher.undo(transaction, sender);
            TransactionDispatcher.undoUnconfirmed(transaction, sender);
        }

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
        return this.process(block, false, null, false);
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

    public validate(block: BlockModel): ResponseEntity<null> {
        const round = RoundRepository.getCurrentRound();
        const prevRound = RoundRepository.getPrevRound();
        BlockHistoryRepository.addEvent(
            block as Block,
            { action: BlockLifecycle.VALIDATE, state: { round, prevRound } },
        );

        const isValid: boolean = validator.validate(block, blockSchema);
        if (!isValid) {
            return new ResponseEntity<null>({
                errors: validator.getLastErrors().map(err => err.message),
            });
        }

        return new ResponseEntity<null>();
    }
}

export default new BlockService();
