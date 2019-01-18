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

    private pool: { [transactionId: string]: Transaction } = {};

    poolByRecipient: { [recipientId: string]: Array<Transaction> } = {};
    poolBySender: { [senderId: string]: Array<Transaction> } = {};

    locked: boolean = false;

    scope: TransactionPoolScope = {} as TransactionPoolScope;

    constructor({ transactionLogic, logger, db }: TransactionPoolScope) {
        this.scope.transactionLogic = transactionLogic;
        this.scope.logger = logger;
        this.scope.db = db;
    }

    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
    }

    getTransactionsByRecipientId(recipientId): Array<Transaction> {
        return this.poolByRecipient[recipientId] || [];
    }

    getTransactionsBySendertId(senderId): Array<Transaction> {
        return this.poolBySender[senderId] || [];
    }

    async removeTransactionBySenderId(senderId: string): Promise<Array<Transaction>> {
        const removedTransactions = [];
        const transactions = this.getTransactionsBySendertId(senderId);
        for (const trs of transactions) {
            await this.remove(trs);
            removedTransactions.push(trs);
        }
        return removedTransactions;
    }

    async push(trs: Transaction, sender?: Account) {
        if (!sender) {
            sender = await getOrCreateAccount(this.scope.db, trs.senderPublicKey);
        }

        if (!this.locked) {
            try {
                await this.scope.transactionLogic.newApplyUnconfirmed(trs, sender);
                trs.status = TransactionStatus.UNCOFIRM_APPLIED;
                this.scope.logger.debug(`TransactionStatus.UNCONFIRM_APPLIED ${JSON.stringify(trs)}`);
            } catch (e) {
                trs.status = TransactionStatus.DECLINED;
                this.scope.logger.error(`[TransactionQueue][applyUnconfirmed]: ${e}`);
                this.scope.logger.error(`[TransactionQueue][applyUnconfirmed][stack]: \n ${e.stack}`);
                return;
            }

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
            return true;
            // TODO on this place may be broadcast logic
        }
        return false;
    }

    async remove(trs: Transaction) {
        if (!this.pool[trs.id]) {
            return false;
        }

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

        if (this.poolBySender[trs.senderId] && this.poolBySender[trs.senderId].indexOf(trs) !== -1) {
            this.poolBySender[trs.senderId].splice(this.poolBySender[trs.senderId].indexOf(trs), 1) ;
        }

        if (this.poolByRecipient[trs.recipientId] && this.poolByRecipient[trs.recipientId].indexOf(trs) !== -1) {
            this.poolByRecipient[trs.recipientId].splice(this.poolByRecipient[trs.recipientId].indexOf(trs), 1) ;
        }
        return true;
    }

    async removeTransactionByRecipientId(recipientId: string): Promise<Array<Transaction>> {
        const removedTransactions = [];
        const transactions = this.getTransactionsByRecipientId(recipientId);
        for (const trs of transactions) {
            await this.remove(trs);
            removedTransactions.push(trs);
        }
        return removedTransactions;
    }

    get(id: string): Transaction {
        return this.pool[id];
    }

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

    getSize(): number {
        return Object.keys(this.pool).length;
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

    private locked: boolean = false;

    constructor({ transactionLogic, transactionPool, logger, db }: TransactionQueueScope) {
        this.scope.transactionLogic = transactionLogic;
        this.scope.transactionPool = transactionPool;
        this.scope.logger = logger;
        this.scope.db = db;
    }

    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
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
        if (this.queue.length === 0 || this.locked) {
            return;
        }

        const trs = this.pop();

        if (this.scope.transactionPool.isPotentialConflict(trs)) {
            this.pushInConflictedQueue(trs);
            // notify in socket
            this.process();
            return;
        }

        const sender = await getOrCreateAccount(this.scope.db, trs.senderPublicKey);
        this.scope.logger.debug(`[TransactionQueue][process][sender] ${JSON.stringify(sender)}`);

        const verifyStatus = await this.verify(trs, sender);

        if (!verifyStatus.verified) {
            trs.status = TransactionStatus.DECLINED;
            // notify in socket
            this.process();
            return;
        }

        trs.status = TransactionStatus.VERIFIED;
        this.scope.logger.debug(`TransactionStatus.VERIFIED ${JSON.stringify(trs)}`);

        if (!this.locked) {
            const pushed = await this.scope.transactionPool.push(trs, sender);
            if (pushed) {
                this.process();
                return;
            }
        }
        this.push(trs);
        this.process();
        }

    async verify(trs: Transaction, sender: Account): Promise<{ verified: boolean, error: Array<string> }> {

        try {
            await this.scope.transactionLogic.newVerify({ trs, sender });
        } catch (e) {
            // TODO change to debug
            this.scope.logger.error(`[TransactionQueue][verify]: ${e}`);
            this.scope.logger.error(`[TransactionQueue][verify][stack]: \n ${e.stack}`);
            return {
                verified: false,
                error: [e]
            }
        }

        try {
            await this.scope.transactionLogic.newVerifyUnconfirmed({ trs, sender });
        } catch (e) {
            // TODO change to debug
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

    getSize(): { conflictedQueue: number, queue: number } {
        return { conflictedQueue: this.conflictedQueue.length, queue: this.queue.length };
    }
}

export default TransactionPool;
