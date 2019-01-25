const bignum = require('../helpers/bignum.js');
const crypto = require('crypto');
const sodium = require('sodium-javascript');
const exceptions = require('../helpers/exceptions.js');
const constants = require('../helpers/constants');

import { Block } from 'shared/model/block';
import { BlockRepo } from 'core/repository/block';
import { getAddressByPublicKey } from 'shared/util/account';
import {Peer} from 'shared/model/peer';
import {PeerRepo} from 'core/repository/peer';
import {Transaction} from 'shared/model/transaction';
import { TransactionPool } from 'core/service/transactionPool';

interface ILoadBlockParams {
    limit: number;
    lastId: string;
}

interface IDBBlockSave {

}

interface IVerifyResult {
    verified: boolean;
    errors: any[];
}

export class BlockService {
    private dbTable: string = 'blocks';
    private dbFields: string[] = [
        'id',
        'version',
        'timestamp',
        'height',
        'previousBlock',
        'numberOfTransactions',
        'totalAmount',
        'totalFee',
        'reward',
        'payloadLength',
        'payloadHash',
        'generatorPublicKey',
        'blockSignature'
    ];
    private lastBlock: Block;
    private lastReceipt: number;
    private lastNBlockIds: string[];
    private readonly currentBlockVersion: number = constants.CURRENT_BLOCK_VERSION;
    private readonly milestones = constants.rewards.milestones;
    private readonly distance = Math.floor(constants.rewards.distance);
    private readonly rewardOffset = Math.floor(constants.rewards.offset);
    private blockRepo: BlockRepo = new BlockRepo();
    private peerRepo: PeerRepo = new PeerRepo();
    private transactionPool = new TransactionPool();

    public loadBlocksData(params: ILoadBlockParams) : Block[] {
        return [];
    }

    public getLastBlock(): Block {
        return this.lastBlock;
    }

    public setLastBlock(block: Block): Block {
        this.lastBlock = block;
        return this.lastBlock;
    }

    public isLastBlockFresh(): boolean {
        return true;
    }

    public getLastReceipt(): number {
        return this.lastReceipt;
    }

    public updateLastReceipt() {
        this.lastReceipt = Math.floor(Date.now() / 1000);
        return this.lastReceipt;
    }

    public isLastReceiptStale() {
        if (!this.lastReceipt) {
            return true;
        }
        const secondsAgo = Math.floor(Date.now() / 1000) - this.lastReceipt;
        return (secondsAgo > constants.blockReceiptTimeOut);
    }

    public saveGenesisBlock(): void {
        const block: Block = this.blockRepo.getGenesisBlock();
        this.saveBlock(block); // config.genesis.block)
    }

    public saveBlock(block: Block): void {
        this.dbSave(block);
        this.promiseTransactions(block);
        this.afterSave(block);
    }

    private dbSave(block: Block): IDBBlockSave {
        let payloadHash,
            generatorPublicKey,
            blockSignature;

        try {
            payloadHash = Buffer.from(block.payloadHash, 'hex');
            generatorPublicKey = Buffer.from(block.generatorPublicKey, 'hex');
            blockSignature = Buffer.from(block.blockSignature, 'hex');
        } catch (e) {
            throw e;
        }

        return {
            table: this.dbTable,
            fields: this.dbFields,
            values: {
                id: block.id,
                version: block.version,
                timestamp: block.timestamp,
                height: block.height,
                previousBlock: block.previousBlock || null,
                numberOfTransactions: block.numberOfTransactions,
                totalAmount: block.totalAmount,
                totalFee: block.totalFee,
                reward: block.reward || 0,
                payloadLength: block.payloadLength,
                payloadHash,
                generatorPublicKey,
                blockSignature
            }
        };
    }

    private afterSave(block: Block): void {
        // call 'transactionsSaved' on bus
        // ?
        block.transactions.forEach((transaction) => library.logic.transaction.afterSave(transaction));
    }

    private async promiseTransactions(block: Block): Promise<object> {
        return await library.logic.transaction.dbSave(transaction);
    }

    public applyGenesisBlock(block: Block): void {
        const tracker = this.getBlockProgressLogger(
            block.transactions.length, block.transactions.length / 100, 'Genesis block loading'
        );
        block.transactions.forEach((transaction) => {
            // busrx call ACCOUNT_SETANDGET
            const sender = modules.accounts.setAccountAndGet({ publicKey: transaction.senderPublicKey });
            this.applyTransaction(block, transaction, sender);
            tracker.applyNext();
        });
        this.setLastBlock(block);
        // busrx call to ROUNDS_TICK
        modules.rounds.tick(block, cb);
    }

    public getBlockProgressLogger(transactionsCount: number, logsFrequency: number, msg: string) {
        function BlockProgressLogger(blockTransactionCount, blockBlogsFrequency, msgBlock) {
            this.target = blockTransactionCount;
            this.step = Math.floor(blockTransactionCount / blockBlogsFrequency);
            this.applied = 0;

            /**
             * Resets applied transactions
             */
            this.reset = function () {
                this.applied = 0;
            };

            /**
             * Increments applied transactions and logs the progress
             * - For the first and last transaction
             * - With given frequency
             */
            this.applyNext = function () {
                if (this.applied >= this.target) {
                    throw new Error(`Cannot apply transaction over the limit: ${this.target}`);
                }
                this.applied += 1;
                if (this.applied === 1 || this.applied === this.target || this.applied % this.step === 1) {
                    this.log();
                }
            };

            /**
             * Logs the progress
             */
            this.log = function () {
                library.logger.info(msgBlock, `${((this.applied / this.target) * 100)
                    .toPrecision(4)} % : applied ${this.applied} of ${this.target} transactions`);
            };
        }

        return new BlockProgressLogger(transactionsCount, logsFrequency, msg);
    }

    private applyTransaction(block: Block, transaction: Transaction<object>, sender): void {
        // FIXME: Not sure about flow here, when nodes have different transactions - 'applyUnconfirmed' can fail but 'apply' can be ok
        await modules.transactions.applyUnconfirmed(transaction, sender);
        await modules.transactions.apply(transaction, block, sender);
    }

    public applyBlock(block: Block, broadcast: boolean, saveBlock: boolean): void {
        // Prevent shutdown during database writes.
        modules.blocks.isActive.set(true);

        // Transactions to rewind in case of error.
        let appliedTransactions = {};

        // List of unconfirmed transactions ids.
        let unconfirmedTransactionIds = new Set();

        // Rewind any unconfirmed transactions before applying block.
        // TODO: It should be possible to remove this call if we can guarantee that only this function is processing transactions atomically. Then speed should be improved further.
        // TODO: Other possibility, when we rebuild from block chain this action should be moved out of the rebuild function.
        private function undoUnconfirmedList(){
            const ids = modules.transactions.undoUnconfirmedList();
        }

        // Apply transactions to unconfirmed mem_accounts fields.
        function applyUnconfirmed() {
            const errors = [];

            block.transactions.forEach((transaction) => {

                // call to ACCOUNT_GET
                const sender = modules.accounts.getAccount({publicKey: transaction.senderPublicKey});
                // call to TRANSACTION_VERIFY_UNCONFIRMED
                library.logic.transaction.verifyUnconfirmed({trs: transaction, sender});

                // DATABASE: write
                // call to TRANSACTION_APPLY_UNCONFIRMED
                modules.transactions.applyUnconfirmed(transaction, sender);
                appliedTransactions[transaction.id] = transaction;

                // Remove the transaction from the node queue, if it was present.
                unconfirmedTransactionIds.delete(transaction.id);
            });

            if (errors.length) {
                block.transactions.forEach((transaction) => {
                    if (!appliedTransactions[transaction.id]) {
                        return setImmediate(() => {
                        });
                    }

                    // call to ACCOUNT_GET
                    const sender = modules.accounts.getAccount({publicKey: transaction.senderPublicKey});
                    // DATABASE: write
                    // call to TRANSACTION_UNDO_UNCONFIRMED
                    library.logic.transaction.undoUnconfirmed(transaction, sender);
                });

            }
        }

        // Block and transactions are ok.
        // Apply transactions to confirmed mem_accounts fields.
        function applyConfirmed() {
            block.transactions.forEach((transaction) => {
                // call to ACCOUNT_GET
                const sender = modules.accounts.getAccount({ publicKey: transaction.senderPublicKey });
                // DATABASE: write
                // call to TRANSACTION_APPLY
                modules.transactions.apply(transaction, block, sender);
                // Transaction applied, removed from the unconfirmed list.
                // call to TRANSACTION_REMOVE_...
                modules.transactions.removeUnconfirmedTransaction(transaction.id);
            });
            // Optionally save the block to the database.
            this.setLastBlock(block);

            if (saveBlock) {
                this.saveBlock(block);
                library.bus.message('newBlock', block, broadcast);
                // DATABASE write. Update delegates accounts
                modules.rounds.tick(block);
            } else {
                library.bus.message('newBlock', block, broadcast);
                // DATABASE write. Update delegates accounts
                modules.rounds.tick(block, seriesCb);
            }

            // Push back unconfirmed transactions list (minus the one that were on the block if applied correctly).
            // TODO: See undoUnconfirmedList discussion above.

            // DATABASE write
            // call to TRANSACTION_APPLY_UNCONFIRMED_IDS
            modules.transactions.applyUnconfirmedIds(Array.from(unconfirmedTransactionIds));

        }

        // Allow shutdown, database writes are finished.
        modules.blocks.isActive.set(false);
    }

    private popLastBlock(oldLastBlock: Block): Block {
        // Load previous block from full_blocks_list table
        // TODO: Can be inefficient, need performnce tests
        let previousBlock: Block = this.loadBlocksPart()[0];
        previousBlock = this.loadBlocksPart({ id: oldLastBlock.previousBlock })[0];
        oldLastBlock.transactions.reverse().forEach((transaction) => {
            // Retrieve sender by public key
            const sender = modules.accounts.getAccount({ publicKey: transaction.senderPublicKey });
            // Undoing confirmed tx - refresh confirmed balance
            // (see: logic.transaction.undo, logic.transfer.undo)
            // WARNING: DB_WRITE
            modules.transactions.undo(transaction, oldLastBlock, sender);
            // Undoing unconfirmed tx - refresh unconfirmed balance (see: logic.transaction.undoUnconfirmed)
            // WARNING: DB_WRITE
            modules.transactions.undoUnconfirmed(transaction);

        });
        // Perform backward tick on rounds
        // WARNING: DB_WRITE
        modules.rounds.backwardTick(oldLastBlock, previousBlock);
        // Delete last block from blockchain
        // WARNING: Db_WRITE
        this.deleteBlock(oldLastBlock.id);
        return previousBlock;
    }

    public loadBlocksPart(filter?): Block[] {
        const rows = this.loadBlocksData(filter);;
        return [];
    }

    public readDbRows(rows: object[]): Block[]  {
        return [];
    }

    public dbRead(raw: {[key: string]: any}, radix: number = 10): Block {
        if (!raw.b_id) {
            return null;
        }
        const block: Block = {
            id: raw.b_id,
            rowId: parseInt(raw.b_rowId, radix),
            version: parseInt(raw.b_version, radix),
            timestamp: parseInt(raw.b_timestamp, radix),
            height: parseInt(raw.b_height, radix),
            previousBlock: raw.b_previousBlock,
            numberOfTransactions: parseInt(raw.b_numberOfTransactions, radix),
            totalAmount: parseInt(raw.b_totalAmount, radix),
            totalFee: parseInt(raw.b_totalFee, radix),
            reward: parseInt(raw.b_reward, radix),
            payloadLength: parseInt(raw.b_payloadLength, radix),
            payloadHash: raw.b_payloadHash,
            generatorPublicKey: raw.b_generatorPublicKey,
            generatorId: getAddressByPublicKey(raw.b_generatorPublicKey),
            blockSignature: raw.b_blockSignature,
            confirmations: parseInt(raw.b_confirmations, radix),
            username: raw.m_username
        };
        block.totalForged = new bignum(block.totalFee).plus(new bignum(block.reward)).toString();
        return block;
    }

    public deleteLastBlock(): Block {
        let lastBlock = this.getLastBlock();
        const newLastBlock = this.popLastBlock(lastBlock);
        return this.setLastBlock(newLastBlock);
    }

    public recoverChain(): Block {
        const newLastBlock: Block = this.deleteLastBlock();
        return newLastBlock;
    }

    public getIdSequence(height: number): { firstHeight: number, ids: []} {
        const lastBlock = this.getLastBlock();
        // Get IDs of first blocks of (n) last rounds, descending order
        // EXAMPLE: For height 2000000 (round 19802)
        // we will get IDs of blocks at height: 1999902, 1999801, 1999700, 1999599, 1999498
        const rows = this.blockRepo.getIdSequence({ height, limit: 5, delegates: Rounds.prototype.getSlotDelegatesCount(height) });

        return { firstHeight: rows[0].height, ids: ids.join(',') };
    }

    public getCommonBlock(peer: Peer, height: number): Block {
        let comparisionFailed = false;

        // Get IDs sequence (comma separated list)
        const ids = this.getIdSequence(height).ids;

        // Perform request to supplied remote peer
        const result = modules.transport.getFromPeer(peer, {
            api: `/blocks/common?ids=${ids}`,
            method: 'GET'
        });
        const common = result.common;
        // Check that block with ID, previousBlock and height exists in database
        const rows = this.blockRepo.getCommonBlock({
            id: result.body.common.id,
            previousBlock: result.body.common.previousBlock,
            height: result.body.common.height
        });
        if (comparisionFailed && modules.transport.poorConsensus()) {
            return this.recoverChain();
        }
    }

    public processBlock(block: Block, broadcast: boolean, saveBlock: boolean, verify = true): void {
        this.addBlockProperties(block, broadcast);
        // this.normalizeBlock(block);
        this.verifyBlock(block);
        this.checkExists(block);
        this.validateBlockSlot(block);
        this.checkTransactions(block, saveBlock);
        this.applyBlock(block, broadcast, saveBlock);
        if (library.config.loading.snapshotRound) {
            modules.system.update();
        }
    }

    public checkTransactions(block: Block, checkExists: boolean): boolean {
        block.transactions.forEach((transaction: Transaction<object>) => {
            transaction.id = library.logic.transaction.getId(transaction);
            transaction.blockId = block.id;
            let sender = modules.accounts.setAccountAndGet({publicKey: transaction.senderPublicKey});
            sender = library.logic.transaction.verify({trs: transaction, sender, checkExists});
            sender = library.logic.transaction.verifyUnconfirmed({trs: transaction, sender, checkExists: true});
            if (err) {
                modules.delegates.fork(block, 2);
                // Undo the offending transaction.
                // DATABASE: write
                modules.transactions.undoUnconfirmed(transaction);
                modules.transactions.removeUnconfirmedTransaction(transaction.id);
            }
        });
        return true;
    }

    public checkExists(block: Block): boolean {
        return true;
    }

    public verifyBlock(block: Block): IVerifyResult {
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

    public verifyForkOne(block: Block, lastBlock: Block, result: IVerifyResult): IVerifyResult {
        modules.delegates.fork(block, 1);
        return result;
    }

    public verifyBlockSlot(block: Block, lastBlock: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    public addBlockProperties(block: Block, broadcast: boolean): Block {
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

    public loadBlocksOffset(limit: number, offset: number, verify: boolean): Block {
        const rows = this.blockRepo.loadBlocksOffset({});
        const blocks = this.readDbRows(rows);
        blocks.forEach((block) => {
            if (block.id === library.genesisblock.block.id) {
                return this.applyGenesisBlock(block);
            }

            this.processBlock(block, false, false, verify);
        });
        return this.getLastBlock();
    }

    public loadBlocksFromPeer(peer: Peer): Block {
        // Set current last block as last valid block
        let lastValidBlock: Block = this.getLastBlock();

        // Normalize peer
        peer = this.peerRepo.create(peer);
        const blocks: Block[] = modules.transport.getFromPeer(peer, {
            method: 'GET',
            api: `/blocks?lastBlockId=${lastValidBlock.id}`
        });

        return lastValidBlock;
    }

    public generateBlock(keypair: object, timestamp: number): Block {
        // Get transactions that will be included in block
        const transactions: Transaction<object>[] = this.transactionPool.getUnconfirmedTransactionsForBlockGeneration(constants.maxTxsPerBlock);
        const block: Block = this.create({
                    keypair,
                    timestamp,
                    previousBlock: this.getLastBlock(),
                    transactions: ready
                });
        this.processBlock(block, true,  true);
        return block;
    }

    public create(data): Block {
        const block: Block = new Block();
        this.sign(block, data.keypair);
        return block;
    }

    public sign(block, keyPair) {
        const blockHash = this.getHash(block);
        const sig = Buffer.alloc(sodium.crypto_sign_BYTES);

        sodium.crypto_sign_detached(sig, blockHash, keyPair.privateKey);
        return sig.toString('hex');
    }

    public getHash(block: Block): string {
        return crypto.createHash('sha256').update(this.getBytes(block)).digest();
    }

    public getBytes(block: Block): Buffer {
        return new Buffer([]);
    }

    private validateBlockSlot(block: Block, lastBlock?: Block): boolean {
        modules.delegates.validateBlockSlotAgainstPreviousRound(block);
        modules.delegates.validateBlockSlot(block);
        return true;
    }

    public receiveBlock(block: Block): void {
        this.updateLastReceipt();
        // Start block processing - broadcast: true, saveBlock: true
        this.processBlock(block, true,  true);
    }

    public receiveForkOne(block: Block, lastBlock: Block): void {
        let tmpBlock: Block = {...block};

        modules.delegates.fork(block, 1);
        const check = this.verifyReceipt(tmpBlock);
        this.deleteLastBlock();
        this.deleteLastBlock();
    }

    public receiveForkFive(block: Block, lastBlock: Block): void {
        let tmpBlock: Block = {...block};

        modules.delegates.fork(block, 5);
        this.validateBlockSlot(tmpBlock, lastBlock);
        const check = this.verifyReceipt(tmpBlock);
        this.deleteLastBlock();
        this.receiveBlock(block);
    }

    public verifyReceipt(block: Block): IVerifyResult {
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

    public setHeight(block: Block, lastBlock: Block): Block {
        block.height = lastBlock.height + 1;

        return block;
    }

    public verifySignature(block: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    public verifyPreviousBlock(block: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    public verifyAgainstLastNBlockIds(block: Block, result: IVerifyResult): IVerifyResult {
        if (this.lastNBlockIds.indexOf(block.id) !== -1) {}
        return result;
    }

    public verifyVersion(block: Block, result: IVerifyResult): IVerifyResult {
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
            // return version === this.currentBlockVersion;
        }

        // If there is an exception - check if version match
        // return Number(exceptionVersion) === version;
        return result;
    }

    public verifyReward(block: Block, result: IVerifyResult): IVerifyResult {
        let expectedReward = this.calcReward(block.height);
        return result;
    }

    public verifyId(block: Block, result: IVerifyResult): IVerifyResult {
        block.id = this.getId(block);
        return result;
    }

    public getId(block: Block): string {
        return crypto.createHash('sha256').update(this.getBytes(block)).digest('hex');
    }

    public verifyBlockSlotWindow(block: Block, result: IVerifyResult): IVerifyResult {
        return result;
    }

    public verifyPayload(block, result) {
        bytes = library.logic.transaction.getBytes(transaction, false, false);
        return result;
    }

    public loadLastBlock(): Block {
        const rows = this.blockRepo.loadLastBlock();
        const block = this.readDbRows([rows])[0];
        return block;
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

    public calculateFee(): number {
        return 0;
    }

    public calcMilestone(height: number) {
        const location = Math.trunc((height - this.rewardOffset) / this.distance);
        const lastMile = this.milestones[this.milestones.length - 1];
        if (location > (this.milestones.length - 1)) {
            return this.milestones.lastIndexOf(lastMile);
        }
        return location;
    }

    public calcReward(height: number) {
        if (height < this.rewardOffset) {
            return 0;
        }
        return this.milestones[this.calcMilestone(height)];
    }

    public calcSupply(height: number) {
        if (height < this.rewardOffset) {
            // Rewards not started yet
            return constants.totalAmount;
        }
        const milestone = this.calcMilestone(height);
        let supply = constants.totalAmount;
        const rewards = [];
        let amount = 0, multiplier = 0;
        // Remove offset from height
        height -= this.rewardOffset - 1;
        for (let i = 0; i < this.milestones.length; i++) {
            if (milestone >= i) {
                multiplier = this.milestones[i];
                if (height < this.distance) {
                    // Measure this.distance thus far
                    amount = height % this.distance;
                } else {
                    amount = this.distance; // Assign completed milestone
                    height -= this.distance; // Deduct from total height

                    // After last milestone
                    if (height > 0 && i === this.milestones.length - 1) {
                        amount += height;
                    }
                }
                rewards.push([amount, multiplier]);
            } else {
                break; // Milestone out of bounds
            }
        }
        for (let i = 0; i < rewards.length; i++) {
            const reward = rewards[i];
            supply += reward[0] * reward[1];
        }
        return supply;
    }
}
