const crypto = require('crypto');
const sodium = require('sodium-javascript');
const exceptions = require('../helpers/exceptions.js');
const constants = require('../helpers/constants');
const zSchema = require('z-schema');
// todo: implement
const logger = require('logger');

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

interface IVerifyResult {
    verified: boolean;
    errors: any[];
}

interface IActionResult {
    success: boolean;
    errors?: string[];
}

class DelegateService {}

export class BlockService {
    private delegateService = new DelegateService();
    private transactionQueue = new TransactionQueue({});
    private transactionPool = new TransactionPoolService({});
    private transactionService: ITransactionService<object> = new TransactionService();
    private transactionRepo = new TransactionRepo();
    private blockRepo: BlockRepo = new BlockRepo();

    private lastBlock: Block;
    private lastReceipt: number;
    private lastNBlockIds: string[];
    private readonly currentBlockVersion: number = constants.CURRENT_BLOCK_VERSION;
    private receiveLocked = false;

    private receiveLock = () => {
        this.receiveLocked = true;
    }

    private receiveUnlock = () => {
        this.receiveLocked = false;
    }

    public generateBlock = async (keypair: { privateKey: string, publicKey: string }, timestamp: number) => {
        let block;
        this.lockTransactionPoolAndQueue();

        const transactions = await this.transactionPool.popSortedUnconfirmedTransactions(constants.maxTxsPerBlock);
        logger.debug(`[Process][newGenerateBlock][transactions] ${JSON.stringify(transactions)}`);

        try {
            block = this.create({
                keypair,
                timestamp,
                previousBlock: this.getLastBlock(),
                transactions
            });
        } catch (e) {
            logger.error(`[Process][newGenerateBlock][create] ${e}`);
            logger.error(`[Process][newGenerateBlock][create][stack] ${e.stack}`);
            throw e;
        }


        try {
            await this.processBlock(block, true, true, true, true);
            this.unlockTransactionPoolAndQueue();
        } catch (e) {
            await this.pushInPool(transactions);
            this.unlockTransactionPoolAndQueue();
            logger.error(`[Process][newGenerateBlock][processBlock] ${e}`);
            logger.error(`[Process][newGenerateBlock][processBlock][stack] ${e.stack}`);
        }
    }

    private async pushInPool(transactions: Array<Transaction<object>>): Promise<void> {
        for (const trs of transactions) {
            await this.transactionPool.push(trs);
        }
    }

    private lockTransactionPoolAndQueue(): void {
        this.transactionQueue.lock();
        this.transactionPool.lock();
    }

    private unlockTransactionPoolAndQueue(): void {
        this.transactionQueue.unlock();
        this.transactionPool.unlock();
    }

    /**
     * @implements system.update
     */
    private async processBlock(block: Block, broadcast: boolean, saveBlock: boolean, verify: boolean = true, tick: boolean = true): Promise<void> {
        this.addBlockProperties(block, broadcast);
        const resultNormalizeBlock = this.normalizeBlock(block);

        if (!resultNormalizeBlock.success) {
            throw new Error(`[normalizeBlock] ${JSON.stringify(resultNormalizeBlock.errors)}`);
        }

        if (verify) {
            const resultVerifyBlock = this.verifyBlock(block);
            if (!resultVerifyBlock.verified) {
                throw new Error(`[verifyBlock] ${JSON.stringify(resultVerifyBlock.errors)}`);
            }
        }

        if (saveBlock) {
            const resultCheckExists = await this.checkExists(block);
            if (!resultCheckExists.success) {
                throw new Error(`[checkExists] ${JSON.stringify(resultCheckExists.errors)}`);
            }
        }
        // validateBlockSlot TODO enable after fix round

        const resultCheckTransactions = await this.checkTransactionsAndApplyUnconfirmed(block, saveBlock, verify);
        if (!resultCheckTransactions.success) {
            throw new Error(`[checkTransactions] ${JSON.stringify(resultCheckTransactions.errors)}`);
        }

        await this.applyBlock(block, broadcast, saveBlock, tick);

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
        this.transactionQueue.reshuffleTransactionQueue();
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

    private normalizeBlock(block: Block): IActionResult {
        try {
            block.transactions.sort(transactionSortFunc);
            this.objectNormalize(block);
            return { success: true, errors: [] };
        } catch (err) {
            return { success: false, errors: [err] };
        }
    }

    private objectNormalize(block: Block): Block {
        let i;

        for (i in block) {
            if (block[i] === null || typeof block[i] === 'undefined') {
                delete block[i];
            }
        }
        const report = zSchema.validate(block, blockShema);

        if (!report) {
            throw `Failed to validate block schema: ${zSchema.getLastErrors().map(err => err.message).join(', ')}`;
        }

        try {
            for (i = 0; i < block.transactions.length; i++) {
                block.transactions[i] = this.transactionService.objectNormalize(block.transactions[i]);
            }
        } catch (e) {
            throw e;
        }

        return block;
    }

    private verifyBlock(block: Block): IVerifyResult {
        const lastBlock = this.getLastBlock();

        block = this.setHeight(block, lastBlock);

        let result = { verified: false, errors: [] };

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
        block.id = this.getId(block);
        return result;
    }

    private getId(block: Block): string {
        return crypto.createHash('sha256').update(this.getBytes(block)).digest('hex');
    }

    private verifyPayload(block: Block, result: IVerifyResult) {
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

    private async checkExists(block: Block): Promise<IActionResult> {
        const exists = await this.blockRepo.isBlockExists(block.id);
        if (!exists) {
            return { success: false, errors: [['Block', block.id, 'already exists'].join(' ')] };
        }
        return { success: true };
    }

    private async checkTransactionsAndApplyUnconfirmed(block: Block, checkExists: boolean, verify: boolean): Promise<IActionResult> {
        const errors = [];
        let i = 0;

        while ((i < block.transactions.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
            const trs: Transaction<object> = block.transactions[i];

            if (errors.length === 0) {
                const sender: Account = await getOrCreateAccount(trs.senderPublicKey);
                logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][sender] ${JSON.stringify(sender)}`);
                if (verify) {
                    const resultCheckTransaction = await this.checkTransaction(block, trs, sender, checkExists);

                    if (!resultCheckTransaction.success) {
                        errors.push(resultCheckTransaction.errors);
                        i--;
                        continue;
                    }
                }

                await this.transactionService.applyUnconfirmed(trs);
                i++;
            } else {
                await this.transactionService.undoUnconfirmed(trs);
                i--;
            }
        }

        return { success: errors.length === 0, errors };
    }

    private checkTransaction = async (block: Block, trs: Transaction<object>, sender: Account, checkExists: boolean) => {
        trs.id = this.transactionService.getId(trs);
        trs.blockId = block.id;

        try {
            await this.transactionService.verify(trs, sender, checkExists);
        } catch (e) {
            return { success: false, errors: [e.message || e] };
        }

        try {
            await this.transactionService.verifyUnconfirmed(trs, sender);
        } catch (e) {
            return { success: false, errors: [e.message || e] };
        }

        return { success: true };
    }

    /**
     * @implements rounds.tick
     */
    private async applyBlock(block: Block, broadcast: boolean, saveBlock: boolean, tick: boolean): Promise<void> {
        if (saveBlock) {
            await this.blockRepo.saveBlock(block);
        }

        for (const trs of block.transactions) {
            const sender = await getOrCreateAccount(trs.senderPublicKey);
            await this.transactionService.apply(trs, block);

            if (saveBlock) {
                trs.blockId = block.id;
                await this.transactionRepo.saveTransaction(trs);
            }
        }

        if (saveBlock) {
            await this.afterSave(block);
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
    }

    private async afterSave(block: Block): Promise<void> {
        // call 'transactionsSaved' on bus
        for (const trs of block.transactions) {
            // how can I call this method in case it exists in service but connection service=service is baned
            await this.transactionService.afterSave(trs);
        }
    }

    /**
     * @implements modules.rounds.calc()
     * @implements slots.getSlotNumber
     * @implements modules.loader.syncing
     * @implements modules.rounds.ticking
     */
    public async processIncomingBlock(block: Block): Promise<void> {
        let lastBlock;

        if (this.receiveLocked) {
            logger.warn(`[Process][onReceiveBlock] locked for id ${block.id}`);
            return;
        }

        // TODO: how to check?
        if (!__private.loaded || modules.loader.syncing() || modules.rounds.ticking()) {
            logger.debug(`[Process][onReceiveBlock] !__private.loaded ${!__private.loaded}`);
            logger.debug(`[Process][onReceiveBlock] syncing ${modules.loader.syncing()}`);
            logger.debug('Client not ready to receive block', block.id);
            return;
        }

        // Get the last block
        lastBlock = this.getLastBlock();

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
    private async receiveBlock(block: Block): Promise<void> {
        logger.info([
            'Received new block id:', block.id,
            'height:', block.height,
            'round:', modules.rounds.calc(block.height),
            'slot:', slots.getSlotNumber(block.timestamp),
            'reward:', block.reward
        ].join(' '));

        this.updateLastReceipt();

        this.lockTransactionPoolAndQueue();

        const removedTransactions = await this.transactionPool.removeFromPool(block.transactions, true);
        logger.debug(`[Process][newReceiveBlock] removedTransactions ${JSON.stringify(removedTransactions)}`);

        try {
            await this.processBlock(block, true, true, true, true);

            const transactionForReturn = [];
            removedTransactions.forEach((removedTrs) => {
                if (!(block.transactions.find(trs => trs.id === removedTrs.id))) {
                    transactionForReturn.push(removedTrs);
                }
            });
            await this.pushInPool(transactionForReturn);
            await this.transactionQueue.returnToQueueConflictedTransactionFromPool(block.transactions);
            this.unlockTransactionPoolAndQueue();
        } catch (e) {
            await this.pushInPool(removedTransactions);
            this.unlockTransactionPoolAndQueue();
            logger.error(`[Process][newReceiveBlock] ${e}`);
            logger.error(`[Process][newReceiveBlock][stack] ${e.stack}`);
        }
    }

    /**
     * @implements modules.delegates.fork
     */
    private async receiveForkOne(block: Block, lastBlock: Block): Promise<void> {
        let tmpBlock: Block = {...block};
        this.delegateService.fork(block, 1);
        tmpBlock = this.objectNormalize(tmpBlock);
        this.validateBlockSlot(block, lastBlock);
        const check = this.verifyReceipt(tmpBlock);
        await this.deleteLastBlock();
        await this.deleteLastBlock();
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

    private async receiveForkFive(block: Block, lastBlock: Block): Promise<void> {
        let tmpBlock: Block = {...block};
        modules.delegates.fork(block, 5);
        tmpBlock = this.objectNormalize(tmpBlock);
        this.validateBlockSlot(tmpBlock, lastBlock);
        const check = this.verifyReceipt(tmpBlock);
        await this.deleteLastBlock();
        this.receiveBlock(block);
    }

    private async deleteLastBlock(): Promise<Block> {
        let lastBlock = this.getLastBlock();
        const newLastBlock = await this.popLastBlock(lastBlock);
        return this.setLastBlock(newLastBlock);
    }

    /**
     * @implements modules.rounds.backwardTick
     */
    private async popLastBlock(oldLastBlock: Block): Promise<Block> {
        let previousBlock: Block = await this.loadBlocksPart(oldLastBlock.previousBlock);
        oldLastBlock.transactions.reverse().forEach((transaction) => {
            this.transactionService.undo(transaction, oldLastBlock);
            this.transactionService.undoUnconfirmed(transaction);
        });
        modules.rounds.backwardTick(oldLastBlock, previousBlock);
        this.blockRepo.deleteBlock(oldLastBlock.id);
        return previousBlock;
    }

    private async loadBlocksPart(previousBlockId: string): Promise<Block> {
        const block: Block = await this.blockRepo.loadFullBlockById(previousBlockId);
        return this.readDbRow(block);
    }

    private readDbRows(rows: object[]): Block[] {
        const blocks = [];
        rows.forEach(row => {
            blocks.push(this.readDbRow(row));
        });
        return blocks;
    }

    private readDbRow(row: object): Block {
        return row as Block;
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
    public async saveGenesisBlock(): Promise<void> {
        const exists: boolean = await this.blockRepo.isBlockExists(genesisBlockId);
        if (!exists) {
            await this.applyGenesisBlock(genesisBlock, false, true); // config.genesis.block
        }
    }

    private async applyGenesisBlock(block: Block, verify?: boolean, save?: boolean): Promise<void> {
        block.transactions = block.transactions.sort(transactionSortFunc);
        try {
            await this.processBlock(block, false, save, verify, false);
            logger.info('[Chain][applyGenesisBlock] Genesis block loading');
        } catch (e) {
            logger.error(`[Chain][applyGenesisBlock] ${e}`);
            logger.error(`[Chain][applyGenesisBlock][stack] ${e.stack}`);
        }
    }

    // used by rpc getCommonBlock
    public async recoverChain(): Promise<Block> {
        const newLastBlock: Block = await this.deleteLastBlock();
        return newLastBlock;
    }

    // used by rpc getCommonBlock
    /**
     * @implements rounds.getSlotDelegatesCount
     */
    public getIdSequence(height: number): { firstHeight: number, ids: []} {
        const lastBlock = this.getLastBlock();
        // Get IDs of first blocks of (n) last rounds, descending order
        // EXAMPLE: For height 2000000 (round 19802)
        // we will get IDs of blocks at height: 1999902, 1999801, 1999700, 1999599, 1999498
        const rows = this.blockRepo.getIdSequence({ height, limit: 5, delegates: Rounds.prototype.getSlotDelegatesCount(height) });

        return { firstHeight: rows[0].height, ids: ids.join(',') };
    }

    // called from loader
    public loadBlocksOffset(limit: number, offset: number, verify: boolean): Block {
        const rows = this.blockRepo.loadBlocksOffset({});
        const blocks = this.readDbRows(rows);
        blocks.forEach(async (block) => {
            if (block.id === library.genesisblock.block.id) {
                return this.applyGenesisBlock(block);
            }

            await this.processBlock(block, false, false, verify);
        });
        return this.getLastBlock();
    }

    private create(data): Block {
        const block: Block = new Block();
        this.sign(block, data.keypair);
        return block;
    }

    private sign(block, keyPair) {
        const blockHash = this.getHash(block);
        const sig = Buffer.alloc(sodium.crypto_sign_BYTES);

        sodium.crypto_sign_detached(sig, blockHash, keyPair.privateKey);
        return sig.toString('hex');
    }

    private getHash(block: Block): string {
        return crypto.createHash('sha256').update(this.getBytes(block)).digest();
    }

    private getBytes(block: Block): Buffer {
        return new Buffer([]);
    }

    // called from loader
    private loadLastBlock(): Block {
        const rows = this.blockRepo.loadLastBlock();
        return this.readDbRow(rows);
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
