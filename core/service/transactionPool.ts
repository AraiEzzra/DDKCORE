import {Transaction, TransactionStatus, TransactionType} from 'shared/model/transaction';
import {transactionSortFunc} from 'core/util/transaction';
import {getAddressByPublicKey, getOrCreateAccount} from 'shared/util/account';
import TransactionService from 'core/service/transaction';
import Response from 'shared/model/response';
// import db from 'shared/driver/db';
import {logger} from 'shared/util/logger';
import SyncService, { ISyncService } from 'core/service/sync';
import { Address } from 'shared/model/account';

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

    getTransactionsByRecipientId(recipientAddress: Address): Array<Transaction<T>>;

    getTransactionsBySenderAddress(senderAddress: Address): Array<Transaction<T>>;

    removeTransactionsBySenderId(senderAddress: Address): Promise<Array<Transaction<T>>>;

    push(trs: Transaction<T>, sender?: Account, broadcast?: boolean);

    remove(trs: Transaction<T>);

    removeTransactionsByRecipientId(address: Address): Promise<Array<Transaction<T>>>;

    get(id: string): Transaction<T>;

    pop(trs: Transaction<T>): Transaction<T>;

    has(trs: Transaction<T>);

    popSortedUnconfirmedTransactions(limit: number): Promise<Array<Transaction<T>>>;

    isPotentialConflict(trs: Transaction<T>);

    getSize(): number;

    removeFromPool(transactions: Array<Transaction<T>>, withDepend: boolean): Promise<Response<Array<Transaction<T>>>>;

    // getUnconfirmedTransactionsForBlockGeneration(): Promise<Array<Transaction<T>>>; // to block service

    // lockTransactionPoolAndQueue(): void; // to block service

    // unlockTransactionPoolAndQueue(): void; // to block service

    // returnToQueueConflictedTransactionFromPool(transactions): Promise<Response<void>>; // to block service

    lock(): Response<void>;

    unlock(): Response<void>;
}

// TODO will be removed
declare class TransactionPoolScope {
    logger?: any;
    transactionLogic: any;
    db?: any;
    bus?: any;
    syncService: ISyncService;
}

// TODO NOT ready
class TransactionPoolService<T extends object> implements ITransactionPoolService<T> {
    batchPush(transactions: Array<Transaction<T>>): Promise<void> {
        return undefined;
    }

    batchRemove(transactions: Array<Transaction<T>>, withDepend: boolean):
        Promise<Array<Transaction<T>>> {
        return undefined;
    }

    private pool: { [transactionId: string]: Transaction<T> } = {};

    poolByRecipient: { [recipientAddress: number]: Array<Transaction<T>> } = {};
    poolBySender: { [senderAddress: number]: Array<Transaction<T>> } = {};

    locked: boolean = false;

    scope: TransactionPoolScope = {} as TransactionPoolScope;

    // redundant
    constructor() {
        this.scope.transactionLogic = TransactionService;
        this.scope.logger = logger;
        // this.scope.db = db;
        this.scope.syncService = SyncService;
    }

    async removeFromPool(transactions: Array<Transaction<T>>, withDepend: boolean):
        Promise<Response<Array<Transaction<T>>>> {
        return new Response({ data: [] });
    }

    async pushInPool(transactions: Array<Transaction<T>>): Promise<void> {
    }

    lock(): Response<void> {
        this.locked = true;
        return new Response<void>();
    }

    unlock(): Response<void> {
        this.locked = false;
        return new Response<void>();
    }

    getLockStatus(): boolean {
        return this.locked;
    }

    getTransactionsByRecipientId(recipientAddress: Address): Array<Transaction<T>> {
        return this.poolByRecipient[recipientAddress] || [];
    }

    getTransactionsBySenderAddress(senderAddress: Address): Array<Transaction<T>> {
        return this.poolBySender[senderAddress] || [];
    }

    async removeTransactionsBySenderId(senderAddress: Address): Promise<Array<Transaction<T>>> {
        const removedTransactions = [];
        const transactions = this.getTransactionsBySenderAddress(senderAddress);
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
            if (!this.poolBySender[trs.senderAddress]) {
                this.poolBySender[trs.senderAddress] = [];
            }
            this.poolBySender[trs.senderAddress].push(trs);
            if (trs.type === TransactionType.SEND) {
                if (!this.poolByRecipient[trs.recipientAddress]) {
                    this.poolByRecipient[trs.recipientAddress] = [];
                }
                this.poolByRecipient[trs.recipientAddress].push(trs);
            }
            if (broadcast) {
                // TODO
                this.scope.syncService.sendNewTransaction(trs);
                this.scope.bus.message('transactionPutInPool', trs);
            }
            return new Response<void>({});
        }
        return new Response<void>({errors: ['Error in pushing transaction']});
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

        if (this.poolBySender[trs.senderAddress] && this.poolBySender[trs.senderAddress].indexOf(trs) !== -1) {
            this.poolBySender[trs.senderAddress].splice(this.poolBySender[trs.senderAddress].indexOf(trs), 1);
        }

        if (this.poolByRecipient[trs.recipientAddress] &&
            this.poolByRecipient[trs.recipientAddress].indexOf(trs) !== -1
        ) {
            this.poolByRecipient[trs.recipientAddress]
                .splice(this.poolByRecipient[trs.recipientAddress].indexOf(trs), 1);
        }
        return true;
    }

    async removeTransactionsByRecipientId(address: Address): Promise<Array<Transaction<T>>> {
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
        const senderAddress = getAddressByPublicKey(trs.senderPublicKey);
        const recipientTrs = this.poolByRecipient[senderAddress] || [];
        const senderTrs = this.poolBySender[senderAddress] || [];
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

export default new TransactionPoolService();
