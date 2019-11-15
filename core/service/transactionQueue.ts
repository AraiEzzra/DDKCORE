import {
    IAsset,
    SerializedTransaction,
    Transaction,
    TransactionLifecycle,
    TransactionStatus,
    TransactionType
} from 'shared/model/transaction';
import { transactionSortFunc, uniqueFilterByKey } from 'core/util/transaction';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import { logger } from 'shared/util/logger';
import { Account } from 'shared/model/account';
import AccountRepository from 'core/repository/account';
import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import SharedTransactionRepo from 'shared/repository/transaction';
import TransactionHistoryRepository from 'core/repository/history/transaction';
import { TransactionId } from 'shared/model/types';
import SystemRepository from 'core/repository/system';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';

const PROCESS_QUEUE_DELAY = 100;

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

    getUniqueTransactions(): Array<Transaction<IAsset>>;

}

class TransactionQueue<T extends IAsset> implements ITransactionQueueService<T> {
    private queue: Array<Transaction<T>> = [];
    private conflictedQueue: Array<Transaction<T>> = [];

    private locked: boolean = false;

    constructor() {
        this.process = this.process.bind(this);
    }

    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;

        this.reshuffle();

        setImmediate(this.process);
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
        TransactionHistoryRepository.addEvent(trs, { action: TransactionLifecycle.PUSH_IN_QUEUE });

        if (this.queue.length === 1) {
            setImmediate(this.process);
        } else {
            this.queue.sort(transactionSortFunc);
        }
    }

    pushInConflictedQueue(trs: Transaction<T>): void {
        this.conflictedQueue.push(trs);
        trs.status = TransactionStatus.QUEUED_AS_CONFLICTED;
        TransactionHistoryRepository.addEvent(trs, { action: TransactionLifecycle.PUSH_IN_CONFLICTED_QUEUE });
    }

    // TODO can be optimized if check senderAddress and recipientAddress
    reshuffle(): void {
        this.queue.push(...this.conflictedQueue);
        this.conflictedQueue.length = 0;
        this.queue.sort(transactionSortFunc);
    }

    // TODO change to mapReduce
    async process(): Promise<void> {
        if (this.queue.length === 0 ||
            this.locked ||
            SystemRepository.synchronization ||
            PeerNetworkRepository.count === 0) {
            return;
        }

        const trs = this.pop();
        TransactionHistoryRepository.addEvent(trs, { action: TransactionLifecycle.PROCESS });

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
        if (trs.type === TransactionType.VOTE) {
            trs.fee = TransactionDispatcher.calculateFee(trs, sender);
        }
        const verifyStatus = TransactionDispatcher.verifyUnconfirmed(trs, sender);

        if (!verifyStatus.success) {
            logger.debug(
                `[Service][TransactionQueue][process][verifyUnconfirmed] ` +
                `${JSON.stringify(verifyStatus.errors.join('. '))}. ` +
                `Transaction id: ${trs.id}. Account address: ${sender.address}, Relay: ${trs.relay}`
            );

            if (trs.relay === 0) {
                trs.status = TransactionStatus.DECLINED;
                TransactionHistoryRepository.addEvent(trs, { action: TransactionLifecycle.DECLINE });
                SocketMiddleware.emitEvent<{ transaction: SerializedTransaction<IAsset>, reason: Array<string> }>(
                    EVENT_TYPES.DECLINE_TRANSACTION,
                    {
                        transaction: SharedTransactionRepo.serialize(trs),
                        reason: verifyStatus.errors
                    }
                );
            }

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
        // TODO exclude to config
        setTimeout(this.process, PROCESS_QUEUE_DELAY);
    }


    getSize(): { conflictedQueue: number, queue: number } {
        return { conflictedQueue: this.conflictedQueue.length, queue: this.queue.length };
    }

    getUniqueTransactions(): Array<Transaction<IAsset>> {
        const transactions = [...this.queue, ...this.conflictedQueue].sort(transactionSortFunc);
        return uniqueFilterByKey<TransactionId>('id', transactions);
    }
}

export default new TransactionQueue();
