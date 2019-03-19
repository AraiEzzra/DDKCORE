import { Transaction, TransactionStatus, IAsset } from 'shared/model/transaction';
import { transactionSortFunc } from 'core/util/transaction';
import constants from '../../config/mainnet/constants';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import {logger} from 'shared/util/logger';
import { Account } from 'shared/model/account';
import { SECOND } from 'core/util/const';
import AccountRepository from 'core/repository/account';
import { ResponseEntity } from 'shared/model/response';

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

    verify(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
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
        if (this.queue.length === 1) {
            this.process();
        } else {
            this.queue.sort(transactionSortFunc);
        }
    }

    pushInConflictedQueue(trs: Transaction<T>): void {
        this.conflictedQueue.push({
            transaction: trs,
            expire: Math.floor(new Date().getTime() / SECOND) + constants.TRANSACTION_QUEUE_EXPIRE
        });
        trs.status = TransactionStatus.QUEUED_AS_CONFLICTED;
    }

    // TODO can be optimized if check senderAddress and recipientAddress
    reshuffle(): void {
        this.queue.push(...this.conflictedQueue.map(obj => obj.transaction));
        this.conflictedQueue.length = 0;
        this.queue.sort(transactionSortFunc);
        this.process();
    }

    // TODO change to mapReduce
    async process(): Promise<void> {
        if (this.queue.length === 0 || this.locked) {
            return;
        }

        const trs = this.pop();

        // TODO redundant in sync variant
        if (TransactionPool.has(trs)) {
            this.process();
            return;
        }

        if (TransactionPool.isPotentialConflict(trs)) {
            this.pushInConflictedQueue(trs);
            // notify in socket
            this.process();
            return;
        }

        const sender: Account = AccountRepository.getByAddress(trs.senderAddress);
        const verifyStatus = TransactionDispatcher.verifyUnconfirmed(trs, sender);

        if (!verifyStatus.success) {
            logger.debug(`TransactionStatus.verifyStatus ${JSON.stringify(verifyStatus)}`);
            trs.status = TransactionStatus.DECLINED;
            // notify in socket
            this.process();
            return;
        }
        trs.status = TransactionStatus.VERIFIED;

        if (!this.locked) {
            TransactionPool.push(trs, sender, true);
            this.process();
            return;
        }

        this.push(trs);
        this.process();
    }


    getSize(): { conflictedQueue: number, queue: number } {
        return { conflictedQueue: this.conflictedQueue.length, queue: this.queue.length };
    }

    verify(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        try {
            TransactionDispatcher.verifyUnconfirmed(trs, sender);
        } catch (error) {
            logger.error(`[TransactionQueue][verifyUnconfirmed]: ${error}`);
            logger.trace(`[TransactionQueue][verifyUnconfirmed][stack]:\n${error.stack}`);
            return new ResponseEntity<void>({ errors: [error] });
        }

        return new ResponseEntity<void>();
    }
}

export default new TransactionQueue();
