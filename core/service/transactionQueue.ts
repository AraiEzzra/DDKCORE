import { Transaction, TransactionStatus } from 'shared/model/transaction';
import { ITransactionPoolService } from 'core/service/transactionPool';
import { transactionSortFunc } from 'core/util/transaction';
import { getOrCreateAccount } from 'shared/util/account';
import constants from 'config/mainnet/constants';
import TransactionService from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import db from 'shared/driver/db';
import {logger} from 'shared/util/logger';
import Response from 'shared/model/response';


export interface ITransactionQueueService<T extends Object> {
    reshuffleTransactionQueue(): Response<void>;

    getLockStatus(): boolean;

    lock(): Response<void>;

    unlock(): Response<void>;

    getLockStatus(): boolean;

    pop(): Transaction<T>;

    push(trs: Transaction<T>): void;

    pushInConflictedQueue(trs: Transaction<T>): void;

    reshuffle();

    process(): Promise<void>;

    getSize(): { conflictedQueue: number, queue: number };
}

// TODO will be removed
declare class TransactionQueueScope<T> {
    transactionPool: any; // ITransactionPoolService<T> but shouldn't be parametrized
    transactionLogic: any;
    logger?: any;
    db?: any;
}

// TODO NOT ready
class TransactionQueue<T extends object> implements ITransactionQueueService<T> {

    private queue: Array<Transaction<T>> = [];
    private conflictedQueue: Array<{ transaction: Transaction<T>, expire: number }> = [];

    private scope: TransactionQueueScope<T> = {} as TransactionQueueScope<T>;

    private locked: boolean = false;

    // redundant
    constructor() {
        this.scope.transactionLogic = TransactionService;
        this.scope.transactionPool = TransactionPool;
        this.scope.logger = logger;
        this.scope.db = db;
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

    pop(): Transaction<T> {
        return this.queue.shift();
    }

    push(trs: Transaction<T>): void {
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

        if (this.scope.transactionPool.has(trs)) {
            this.process();
            return;
        }

        if (this.scope.transactionPool.isPotentialConflict(trs)) {
            this.pushInConflictedQueue(trs);
            // notify in socket
            this.process();
            return;
        }

        const sender = await getOrCreateAccount(trs.senderPublicKey);
        this.scope.logger.debug(`[TransactionQueue][process][sender] ${JSON.stringify(sender)}`);

        const verifyStatus = await TransactionService.verify(trs, sender, true);

        if (!verifyStatus.verified) {
            trs.status = TransactionStatus.DECLINED;
            // notify in socket
            this.process();
            return;
        }

        trs.status = TransactionStatus.VERIFIED;
        this.scope.logger.debug(`TransactionStatus.VERIFIED ${JSON.stringify(trs)}`);

        if (!this.locked) {
            const pushed = await this.scope.transactionPool.push(trs, sender, true);
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

    reshuffleTransactionQueue(): Response<void> { return new Response<void>(); }
}

export default new TransactionQueue();
