import autobind from 'autobind-decorator';

import {
    IAsset,
    SerializedTransaction,
    Transaction,
    TransactionLifecycle,
    TransactionStatus
} from 'shared/model/transaction';
import { transactionSortFunc } from 'core/util/transaction';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import { logger } from 'shared/util/logger';
import { Account } from 'shared/model/account';
import { SECOND } from 'core/util/const';
import AccountRepository from 'core/repository/account';
import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import SharedTransactionRepo from 'shared/repository/transaction';
import config from 'shared/config';

export interface ITransactionQueueService<T extends Object> {
    getLockStatus(): boolean;

    lock(): void;

    unlock(): void;

    push(trs: Transaction<T>): void;

    pop(): Transaction<T>;

    pushInConflictedQueue(trs: Transaction<T>): void;

    reshuffle(): void;

    process(): Promise<void>;

    getSize(): { conflictedQueue: number, queue: number };

}

class TransactionQueue<T extends IAsset> implements ITransactionQueueService<T> {
    private queue: Array<Transaction<T>> = [];
    private conflictedQueue: Array<{ transaction: Transaction<T>, expire: number }> = [];

    private locked: boolean = false;

    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
    }

    getLockStatus(): boolean {
        return this.locked;
    }

    pop(): Transaction<T> {
        return this.queue.shift();
    }

    push(trs: Transaction<T>): void {
        if (this.queue.findIndex(t => t.id === trs.id) !== -1) {
            return;
        }

        trs.status = TransactionStatus.QUEUED;
        this.queue.push(trs);
        trs.addHistory(TransactionLifecycle.PUSH_IN_QUEUE);
        
        if (this.queue.length === 1) {
            setImmediate(this.process);
        } else {
            this.queue.sort(transactionSortFunc);
        }
    }

    pushInConflictedQueue(trs: Transaction<T>): void {
        this.conflictedQueue.push({
            transaction: trs,
            expire: Math.floor(new Date().getTime() / SECOND) + config.CONSTANTS.TRANSACTION_QUEUE_EXPIRE
        });
        trs.status = TransactionStatus.QUEUED_AS_CONFLICTED;
        trs.addHistory(TransactionLifecycle.PUSH_IN_CONFLICTED_QUEUE);
    }

    // TODO can be optimized if check senderAddress and recipientAddress
    reshuffle(): void {
        this.queue.push(...this.conflictedQueue.map(obj => obj.transaction));
        this.conflictedQueue.length = 0;
        this.queue.sort(transactionSortFunc);
        setImmediate(this.process);
    }

    // TODO change to mapReduce
    @autobind
    async process(): Promise<void> {
        if (this.queue.length === 0 || this.locked) {
            return;
        }

        const trs = this.pop();
        trs.addHistory(TransactionLifecycle.PROCESS);

        // TODO redundant in sync variant
        if (TransactionPool.has(trs)) {
            setImmediate(this.process);
            return;
        }

        if (TransactionPool.isPotentialConflict(trs)) {
            this.pushInConflictedQueue(trs);
            setImmediate(this.process);
            return;
        }

        const sender: Account = AccountRepository.getByAddress(trs.senderAddress);
        const verifyStatus = TransactionDispatcher.verifyUnconfirmed(trs, sender);

        if (!verifyStatus.success) {
            logger.error(
                `[Service][TransactionQueue][process][verifyUnconfirmed] ` +
                `${JSON.stringify(verifyStatus.errors.join('. '))}. Transaction: ${trs.id}`
            );
            trs.status = TransactionStatus.DECLINED;
            trs.addHistory(TransactionLifecycle.DECLINE);

            SocketMiddleware.emitEvent<{ transaction: SerializedTransaction<IAsset>, reason: Array<string> }>(
                EVENT_TYPES.DECLINE_TRANSACTION,
                {
                    transaction: SharedTransactionRepo.serialize(trs),
                    reason: verifyStatus.errors
                }
            );

            setImmediate(this.process);
            return;
        }
        trs.status = TransactionStatus.VERIFIED;

        if (!this.locked) {
            TransactionPool.push(trs, sender, true);
            setImmediate(this.process);
            return;
        }

        this.push(trs);
        setImmediate(this.process);
    }


    getSize(): { conflictedQueue: number, queue: number } {
        return { conflictedQueue: this.conflictedQueue.length, queue: this.queue.length };
    }
}

export default new TransactionQueue();
