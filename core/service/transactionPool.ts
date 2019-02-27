import {Transaction, TransactionStatus, TransactionType, IAsset} from 'shared/model/transaction';
import {transactionSortFunc} from 'core/util/transaction';
import {getAddressByPublicKey, getOrCreateAccount} from 'shared/util/account';
import TransactionDispatcher from 'core/service/transaction';
import Response from 'shared/model/response';
// import db from 'shared/driver/db';
import {logger} from 'shared/util/logger';
import SyncService from 'core/service/sync';
import { Address, Account } from 'shared/model/account';
import AccountRepository from 'core/repository/account';

export interface ITransactionPoolService<T extends Object> {
    /**
     * old removeFromPool
     */
    batchRemove(transactions: Array<Transaction<T>>, withDepend: boolean): Promise<Response<Array<Transaction<T>>>>;

    /**
     *
     * old pushInPool
     */
    batchPush(transactions: Array<Transaction<T>>): Promise<void>;

    getLockStatus(): boolean;

    getBySenderAddress(senderAddress: Address): Array<Transaction<T>>;
    getByRecipientAddress(recipientAddress: Address): Array<Transaction<T>>;

    removeBySenderAddress(senderAddress: Address): Promise<Array<Transaction<T>>>;
    removeByRecipientAddress(address: Address): Promise<Array<Transaction<T>>>;

    push(trs: Transaction<T>, sender?: Account, broadcast?: boolean);

    remove(trs: Transaction<T>);

    get(id: string): Transaction<T>;

    pop(trs: Transaction<T>): Transaction<T>;

    has(trs: Transaction<T>);

    popSortedUnconfirmedTransactions(limit: number): Promise<Array<Transaction<T>>>;

    isPotentialConflict(trs: Transaction<T>);

    getSize(): number;

    lock(): Response<void>;

    unlock(): Response<void>;
}

class TransactionPoolService<T extends object> implements ITransactionPoolService<T> {
    private pool: { [transactionId: string]: Transaction<T> } = {};

    poolByRecipient: { [recipientAddress: number]: Array<Transaction<T>> } = {};
    poolBySender: { [senderAddress: number]: Array<Transaction<T>> } = {};

    locked: boolean = false;

    batchPush(transactions: Array<Transaction<T>>): Promise<void> {
        return undefined;
    }

    async batchRemove(
        transactions: Array<Transaction<T>>,
        withDepend: boolean,
    ): Promise<Response<Array<Transaction<T>>>> {
        const removedTransactions = [];
        for (const trs of transactions) {
            if (withDepend) {
                removedTransactions.push(...await this.removeBySenderAddress(trs.senderAddress));
                removedTransactions.push(...await this.removeByRecipientAddress(trs.senderAddress));
            } else {
                const removed = await this.remove(trs);
                if (removed) {
                    removedTransactions.push(trs);
                }
            }
        }

        return new Response<Array<Transaction<T>>>({ data: removedTransactions });
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

    getByRecipientAddress(recipientAddress: Address): Array<Transaction<T>> {
        return this.poolByRecipient[recipientAddress] || [];
    }

    getBySenderAddress(senderAddress: Address): Array<Transaction<T>> {
        return this.poolBySender[senderAddress] || [];
    }

    async removeBySenderAddress(senderAddress: Address): Promise<Array<Transaction<T>>> {
        const removedTransactions = [];
        const transactions = this.getBySenderAddress(senderAddress);
        for (const trs of transactions) {
            await this.remove(trs);
            removedTransactions.push(trs);
        }
        return removedTransactions;
    }

    async push(trs: Transaction<T>, sender?: Account, broadcast: boolean = false): Promise<Response<void>> {
        if (!sender) {
            // sender = await getOrCreateAccount(trs.senderPublicKey);
            sender = AccountRepository.getByPublicKey(trs.senderPublicKey);
        }

        if (!this.locked) {
            try {
                await TransactionDispatcher.applyUnconfirmed(trs, sender);
                trs.status = TransactionStatus.UNCONFIRM_APPLIED;
                logger.debug(`TransactionStatus.UNCONFIRM_APPLIED ${JSON.stringify(trs)}`);
            } catch (e) {
                trs.status = TransactionStatus.DECLINED;
                logger.error(`[TransactionPool][applyUnconfirmed]: ${e}`);
                logger.error(`[TransactionPool][applyUnconfirmed][stack]: \n ${e.stack}`);
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
                // TODO: fix broadcast storm
                SyncService.sendUnconfirmedTransaction(trs);
            }
            console.log(`pool size: ${Object.keys(this.pool).length}, id: ${trs.id}`);

            return new Response<void>({});
        }
        return new Response<void>({errors: ['Error in pushing transaction']});
    }

    async remove(trs: Transaction<T>) {
        if (!this.pool[trs.id]) {
            return false;
        }

        try {
            await TransactionDispatcher.undoUnconfirmed(trs);
        } catch (e) {
            logger.error(`[TransactionPool][remove]: ${e}`);
            logger.debug(`[TransactionPool][remove][stack]: \n ${e.stack}`);
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

    async removeByRecipientAddress(address: Address): Promise<Array<Transaction<T>>> {
        const removedTransactions = [];
        const transactions = this.getByRecipientAddress(address);
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
