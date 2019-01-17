import {Account, Transaction, TransactionStatus} from "src/helpers/types";
import * as AccountsSql from 'src/sql/accounts.js'
import {getOrCreateAccount} from "src/helpers/account.utils";
import {transactionSortFunc} from "src/helpers/transaction.utils";
import * as constants from 'src/helpers/constants.js';

declare class TransactionPoolScope {
    logger: any;
    transactionLogic: any;
    db: any;
}

class TransactionPool {

    pool: { [transactionId: string]: Transaction } = {};

    poolByRecipient: { [recipientId: string]: Array<Transaction> } = {};
    poolBySender: { [senderId: string]: Array<Transaction> } = {};


    scope: TransactionPoolScope = {} as TransactionPoolScope;

    constructor({ transactionLogic, logger, db }: TransactionPoolScope) {
        this.scope.transactionLogic = transactionLogic;
        this.scope.logger = logger;
        this.scope.db = db;
    }

    /**
     * used in:
     *  new transaction create on this node and verified as correct
     *
     * lock on moment block generation
     */
    push(trs: Transaction) {
        trs.status = TransactionStatus.PUT_IN_POOL;
        this.pool[trs.id] = trs;
        if (!this.poolBySender[trs.senderId]) {
            this.poolBySender[trs.senderId] = [];
        }
        this.poolBySender[trs.senderId].push(trs);
        if (trs.recipientId) {
            if (!this.poolByRecipient[trs.recipientId]) {
                this.poolByRecipient[trs.recipientId] = [];
            }
            this.poolByRecipient[trs.recipientId].push(trs);
        }
        // TODO on this place may be broadcast logic
    }

    /**
     * used in:
     *  expire time
     *  more then limit (bubble logic or not?)
     *  put into block
     *  exist in new common block
     *  after verify on new trs
     */
    async remove(trs: Transaction) {
        let sender = await this.scope.db.one(AccountsSql.getAccountByPublicKey, {
            publicKey: trs.senderPublicKey
        });
        sender = new Account(sender);
        try {
            await this.scope.transactionLogic.newUndoUnconfirmed(trs, sender);
        } catch (e) {
            this.scope.logger.error(`[TransactionPool][remove]: ${e}`);
            this.scope.logger.error(`[TransactionPool][remove][stack]: \n ${e.stack}`);
        }

        delete this.pool[trs.id];
        this.poolBySender[trs.senderId].splice(this.poolBySender[trs.senderId].indexOf(trs), 1) ;
        this.poolByRecipient[trs.recipientId].splice(this.poolByRecipient[trs.recipientId].indexOf(trs), 1) ;
    }

    /**
     * used in:
     *  broadcast
     */
    get(id: string): Transaction {
        return this.pool[id];
    }

    /**
     * used in:
     *  put into block
     */
    pop(trs: Transaction): Transaction {
        const deletedValue = this.get(trs.id);
        this.remove(trs);
        return deletedValue;
    }

    async popSortedUnconfirmedTransactions(limit: number): Promise<Array<Transaction>> {
        const transactions = Object.values(this.pool).sort(transactionSortFunc).slice(0, limit);
        for (const trs of transactions) {
            await this.remove(trs);
        }

        return transactions;
    }

    isPotentialConflict(trs: Transaction) {
        const recipentsTrs = this.poolByRecipient[trs.senderId] || [];
        const sendersTrs = this.poolBySender[trs.senderId] || [];
        const dependTransactions = [...recipentsTrs, ...sendersTrs];

        if (dependTransactions.length === 0) {
            return false;
        }

        dependTransactions.push(trs);
        dependTransactions.sort(transactionSortFunc);

        return dependTransactions.indexOf(trs) !== (dependTransactions.length - 1);
    }

}

declare class TransactionQueueScope {
    transactionPool: TransactionPool;
    transactionLogic: any;
    logger: any;
    db: any;
}

export class TransactionQueue {

    private queue: Array<Transaction> = [];
    private conflictedQueue: Array<{ transaction: Transaction, expire: number }> = [];

    private scope: TransactionQueueScope = {} as TransactionQueueScope;

    constructor({ transactionLogic, transactionPool, logger, db }: TransactionQueueScope) {
        this.scope.transactionLogic = transactionLogic;
        this.scope.transactionPool = transactionPool;
        this.scope.logger = logger;
        this.scope.db = db;
    }

    pop(): Transaction {
        return this.queue.shift();
    }

    push(trs: Transaction): void {
        trs.status = TransactionStatus.QUEUED;
        this.queue.push(trs);
        if (this.queue.length === 1) {
            this.process();
        } else {
            this.queue.sort(transactionSortFunc);
        }
    }

    pushInConflictedQueue(trs: Transaction): void {
        this.conflictedQueue.push({
            transaction: trs,
            expire: Math.floor(new Date().getTime() / 1000) + constants.TRANSACTION_QUEUE_EXPIRE
        });
        trs.status = TransactionStatus.QUEUED_AS_CONFLICTED;
        this.scope.logger.debug(`TransactionStatus.QUEUED_AS_CONFLICTED ${JSON.stringify(trs)}`);
    }

    // TODO can be optimized if check senderId and recipientId
    reshuffle() {
        while (this.conflictedQueue.length > 0) {
            this.push(this.conflictedQueue.pop().transaction);
        }
    }

    async process(): Promise<void> {
        if (this.queue.length >= 1) {
            const trs = this.pop();

            const sender = await getOrCreateAccount(this.scope.db, trs.senderPublicKey);
            this.scope.logger.debug(`[TransactionQueue][process][sender] ${JSON.stringify(sender)}`);

            const processStatus = await this.processTrs(trs, sender);
            if (!processStatus) {
                // notify in socket
                return;
            }
            trs.status = TransactionStatus.PROCESSED;
            this.scope.logger.debug(`TransactionStatus.PROCESSED ${JSON.stringify(trs)}`);

            if (this.scope.transactionPool.isPotentialConflict(trs)) {
                this.pushInConflictedQueue(trs);
                // notify in socket
                return;
            }

            const verifyStatus = await this.verify(trs, sender);

            if (!verifyStatus.verified) {
                trs.status = TransactionStatus.DECLINED;
                // notify in socket
                return;
            }

            trs.status = TransactionStatus.VERIFIED;
            this.scope.logger.debug(`TransactionStatus.VERIFIED ${JSON.stringify(trs)}`);

            await this.applyUnconfirmed(trs, sender);
            trs.status = TransactionStatus.UNCOFIRM_APPLIED;
            this.scope.logger.debug(`TransactionStatus.UNCOFIRM_APPLIED ${JSON.stringify(trs)}`);

            this.scope.transactionPool.push(trs);
            this.process();
        }
    }

    async processTrs(trs: Transaction, sender: Account): Promise<{ success: boolean, error?: Array<string> }> {
        try {
            this.scope.transactionLogic.newProcess(trs, sender);
            return { success: true };
        } catch (e) {
            this.scope.logger.error(`[TransactionQueue][processTrs]: ${e}`);
            this.scope.logger.error(`[TransactionQueue][processTrs][stack]: \n ${e.stack}`);
            return {
                success: false,
                error: [e]
            }
        }

    }

    async verify(trs: Transaction, sender: Account): Promise<{ verified: boolean, error: Array<string> }> {

        try {
            await this.scope.transactionLogic.newVerify({ trs, sender });
        } catch (e) {
            this.scope.logger.error(`[TransactionQueue][verify]: ${e}`);
            this.scope.logger.error(`[TransactionQueue][verify][stack]: \n ${e.stack}`);
            return {
                verified: false,
                error: [e]
            }
        }

        try {
            this.scope.transactionLogic.newVerifyUnconfirmed({ trs, sender });
        } catch (e) {
            this.scope.logger.error(`[TransactionQueue][verifyUnconfirmed]: ${e}`);
            this.scope.logger.error(`[TransactionQueue][verifyUnconfirmed][stack]: \n ${e.stack}`);
            return {
                verified: false,
                error: [e]
            }
        }

        return {
            verified: true,
            error: []
        }
    }

    async applyUnconfirmed(trs: Transaction, sender: Account): Promise<void> {
        try {
            await this.scope.transactionLogic.newApplyUnconfirmed(trs, sender);
        } catch (e) {
            trs.status = TransactionStatus.DECLINED;
            this.scope.logger.error(`[TransactionQueue][applyUnconfirmed]: ${e}`);
            this.scope.logger.error(`[TransactionQueue][applyUnconfirmed][stack]: \n ${e.stack}`);
        }
    }
}

// SELECT * from u_pull where senderId={id} and recipientId={id};  -- verify
// SELECT * from u_pull order by type, timestamp, id limit 25 --one per iteration -- create block
// INSERT INTO u_pull transaction
// SELECT

export default TransactionPool;
