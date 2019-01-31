import { Transaction, TransactionStatus, TransactionType } from 'shared/model/transaction';
import { transactionSortFunc } from 'core/util/transaction';
import { generateAddressByPublicKey, getOrCreateAccount } from 'shared/util/account.utils';
import Response from 'shared/model/response';

// wait declare by @Fisenko
declare class Account {
}

export interface ITransactionPoolService<T extends Object> {

    /**
     * old removeFromPool
     */
    batchRemove(transactions: Array<Transaction<T>>, withDepend: boolean): Promise<Array<Transaction<T>>>;

    /**
     *
     * old pushInPool
     */
    batchPush(transactions: Array<Transaction<T>>): Promise<void>;

    getLockStatus(): boolean;

    getTransactionsByRecipientId(recipientId: string): Array<Transaction<T>>;

    getTransactionsBySenderId(senderId: string): Array<Transaction<T>>;

    removeTransactionsBySenderId(senderId: string): Promise<Array<Transaction<T>>>;

    push(trs: Transaction<T>, sender?: Account, broadcast?: boolean);

    remove(trs: Transaction<T>);

    removeTransactionsByRecipientId(address: string): Promise<Array<Transaction<T>>>;

    get(id: string): Transaction<T>;

    pop(trs: Transaction<T>): Transaction<T>;

    has(trs: Transaction<T>);

    popSortedUnconfirmedTransactions(limit: number): Promise<Array<Transaction<T>>>;

    isPotentialConflict(trs: Transaction<T>);

    getSize(): number;

    getUnconfirmedTransactionsForBlockGeneration(): Promise<Array<Transaction<T>>>; // to block service

    lockTransactionPoolAndQueue(): void; // to block service

    unlockTransactionPoolAndQueue(): void; // to block service

    returnToQueueConflictedTransactionFromPool(transactions): Promise<void>; // to block service
}

// TODO will be removed
declare class TransactionPoolScope {
    logger: any;
    transactionLogic: any;
    db: any;
    bus: any;
}

// TODO NOT ready
export class TransactionPoolService<T extends object> implements ITransactionPoolService<T> {

    private pool: { [transactionId: string]: Transaction<T> } = {};

    poolByRecipient: { [recipientId: string]: Array<Transaction<T>> } = {};
    poolBySender: { [senderId: string]: Array<Transaction<T>> } = {};

    locked: boolean = false;

    scope: TransactionPoolScope = {} as TransactionPoolScope;

    constructor({ transactionLogic, logger, db, bus }: TransactionPoolScope) {
        this.scope.transactionLogic = transactionLogic;
        this.scope.logger = logger;
        this.scope.db = db;
        this.scope.bus = bus;
    }

    removeFromPool(transactions: Array<Transaction<T>>, withDepend: boolean): Promise<Response<Array<Transaction<T>>>> {
    }

    pushInPool(transactions: Array<Transaction<T>>): Promise<void> {
    }

    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
    }

    getLockStatus(): boolean {
        return this.locked;
    }

    getTransactionsByRecipientId(recipientId: string): Array<Transaction<T>> {
        return this.poolByRecipient[recipientId] || [];
    }

    getTransactionsBySenderId(senderId: string): Array<Transaction<T>> {
        return this.poolBySender[senderId] || [];
    }

    async removeTransactionsBySenderId(senderId: string): Promise<Array<Transaction<T>>> {
        const removedTransactions = [];
        const transactions = this.getTransactionsBySenderId(senderId);
        for (const trs of transactions) {
            await this.remove(trs);
            removedTransactions.push(trs);
        }
        return removedTransactions;
    }

    async push(trs: Transaction<T>, sender?: Account, broadcast: boolean = false): Promise<Response<void>> {
        if (!sender) {
            sender = await getOrCreateAccount(trs.senderPublicKey);
        }

        if (!this.locked) {
            try {
                await this.scope.transactionLogic.newApplyUnconfirmed(trs, sender);
                trs.status = TransactionStatus.UNCONFIRM_APPLIED;
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
            if (trs.type === TransactionType.SEND) {
                if (!this.poolByRecipient[trs.recipientId]) {
                    this.poolByRecipient[trs.recipientId] = [];
                }
                this.poolByRecipient[trs.recipientId].push(trs);
            }
            if (broadcast) {
                this.scope.bus.message('transactionPutInPool', trs);
            }
            return new Response<void>({});
        }
        return new Response<void>({ errors: ['Error in pushing transaction'] });
    }

    async remove(trs: Transaction<T>) {
        if (!this.pool[trs.id]) {
            return false;
        }

        try {
            await this.scope.transactionLogic.newUndoUnconfirmed(trs);
        } catch (e) {
            this.scope.logger.error(`[TransactionPool][remove]: ${e}`);
            this.scope.logger.debug(`[TransactionPool][remove][stack]: \n ${e.stack}`);
        }

        delete this.pool[trs.id];

        if (this.poolBySender[trs.senderId] && this.poolBySender[trs.senderId].indexOf(trs) !== -1) {
            this.poolBySender[trs.senderId].splice(this.poolBySender[trs.senderId].indexOf(trs), 1);
        }

        if (this.poolByRecipient[trs.recipientId] && this.poolByRecipient[trs.recipientId].indexOf(trs) !== -1) {
            this.poolByRecipient[trs.recipientId].splice(this.poolByRecipient[trs.recipientId].indexOf(trs), 1);
        }
        return true;
    }

    async removeTransactionsByRecipientId(address: string): Promise<Array<Transaction<T>>> {
        const removedTransactions = [];
        const transactions = this.getTransactionsByRecipientId(address);
        for (const trs of transactions) {
            await this.remove(trs);
            removedTransactions.push(trs);
        }
        return removedTransactions;
    }

    get(id: string): Transaction<T> {
        return this.pool[id];
    }

    pop(trs: Transaction<T>): Transaction<T> {
        const deletedValue = this.get(trs.id);
        this.remove(trs);
        return deletedValue;
    }

    has(trs: Transaction<T>) {
        return Boolean(this.pool[trs.id]);
    }

    async popSortedUnconfirmedTransactions(limit: number): Promise<Array<Transaction<T>>> {
        const transactions = Object.values(this.pool).sort(transactionSortFunc).slice(0, limit);
        for (const trs of transactions) {
            await this.remove(trs);
        }

        return transactions;
    }

    isPotentialConflict(trs: Transaction<T>) {
        const senderId = generateAddressByPublicKey(trs.senderPublicKey);
        const recipientTrs = this.poolByRecipient[senderId] || [];
        const senderTrs = this.poolBySender[senderId] || [];
        const dependTransactions = [...recipientTrs, ...senderTrs];

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
