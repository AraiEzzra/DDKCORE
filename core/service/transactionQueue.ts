import { Transaction, TransactionStatus, IAsset } from 'shared/model/transaction';
import { transactionSortFunc } from 'core/util/transaction';
import { getOrCreateAccount } from 'shared/util/account';
import constants from '../../config/mainnet/constants';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
// import db from 'shared/driver/db';
import {logger} from 'shared/util/logger';
import { Account } from 'shared/model/account';
import { SECOND } from 'core/util/const';
import AccountRepository from 'core/repository/account';
import ResponseEntity from 'shared/model/response';

export interface ITransactionQueueService<T extends Object> {
    reshuffle(): ResponseEntity<void>;

    getLockStatus(): boolean;

    lock(): ResponseEntity<void>;
    unlock(): ResponseEntity<void>;

    push(trs: Transaction<T>): void;
    pop(): Transaction<T>;

    pushInConflictedQueue(trs: Transaction<T>): void;

    reshuffle();

    process(): Promise<void>;

    getSize(): { conflictedQueue: number, queue: number };

    verify(trs: Transaction<T>, sender: Account): Promise<ResponseEntity<void>>;
}

class TransactionQueue<T extends IAsset> implements ITransactionQueueService<T> {
    private queue: Array<Transaction<T>> = [];
    private conflictedQueue: Array<{ transaction: Transaction<T>, expire: number }> = [];

    private locked: boolean = false;

    lock(): ResponseEntity<void> {
        this.locked = true;
        return new ResponseEntity<void>();
    }

    unlock(): ResponseEntity<void> {
        this.locked = false;
        return new ResponseEntity<void>();
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
        logger.debug(`TransactionStatus.QUEUED_AS_CONFLICTED ${JSON.stringify(trs)}`);
    }

    // TODO can be optimized if check senderId and recipientId
    reshuffle(): ResponseEntity<void> {
        while (this.conflictedQueue.length > 0) {
            this.push(this.conflictedQueue.pop().transaction);
        }

        return new ResponseEntity<void>();
    }

    async process(): Promise<void> {
        if (this.queue.length === 0 || this.locked) {
            return;
        }

        const trs = this.pop();

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

        // const sender = await getOrCreateAccount(trs.senderPublicKey);
        const sender: Account = AccountRepository.getByPublicKey(trs.senderPublicKey);
        const verifyStatus = await TransactionDispatcher.verifyUnconfirmed(trs, sender, true);

        if (!verifyStatus.success) {
            logger.debug(`TransactionStatus.verifyStatus ${JSON.stringify(verifyStatus)}`);
            trs.status = TransactionStatus.DECLINED;
            // notify in socket
            this.process();
            return;
        }

        trs.status = TransactionStatus.VERIFIED;
        logger.debug(`TransactionStatus.VERIFIED ${JSON.stringify(trs)}`);

        if (!this.locked) {
            const pushed = await TransactionPool.push(trs, sender, true);
            if (pushed) {
                this.process();
                return;
            }
        }
        this.push(trs);
        this.process();
    }


    getSize(): { conflictedQueue: number, queue: number } {
        return { conflictedQueue: this.conflictedQueue.length, queue: this.queue.length };
    }

    async verify(trs: Transaction<T>, sender: Account): Promise<ResponseEntity<void>> {
        try {
            await TransactionDispatcher.verifyUnconfirmed(trs, sender);
        } catch (error) {
            logger.error(`[TransactionQueue][verifyUnconfirmed]: ${error}`);
            logger.trace(`[TransactionQueue][verifyUnconfirmed][stack]:\n${error.stack}`);
            return new ResponseEntity<void>({ errors: [error] });
        }

        return new ResponseEntity<void>();
    }
}

export default new TransactionQueue();
