import {Account, Transaction, transactionSortFunc, TransactionStatus} from "src/helpers/types";
import * as constants from 'src/helpers/constants';
import * as AccountsSql from 'src/sql/accounts.js'
import {getOrCreateAccount} from "src/helpers/account.utils";

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
    set(trs: Transaction) {
        trs.status = TransactionStatus.PUT_IN_PUL;
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
    remove(trs: Transaction) {
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

    async getUnconfirmedTransactionsForBlockGeneration(): Promise<Array<Transaction>> {
        const transactions = Object.values(this.pool).sort(transactionSortFunc).slice(0, constants.maxTxsPerBlock);
        for (const trs of transactions) {

            let sender = await this.scope.db.one(AccountsSql.getAccountByPublicKey, {
                publicKey: trs.senderPublicKey
            });
            sender = new Account(sender);
            try {
                await this.scope.transactionLogic.newUndoUnconfirmed(trs, sender);
            } catch (e) {
                this.scope.logger.error(`[TransactionPool][getUnconfirmedTransactionsForBlockGeneration]: ${e}`);
                this.scope.logger.error(
                    `[TransactionPool][getUnconfirmedTransactionsForBlockGeneration][stack]: \n ${e.stack}`
                );
            }
        }

        return transactions;
    }

}

declare class TransactionQueueScope {
    transactionPool: TransactionPool;
    transactionLogic: any;
    logger: any;
    db: any;
}

export class TransactionQueue {

    queue: Array<Transaction> = [];

    scope: TransactionQueueScope = {} as TransactionQueueScope;

    constructor({ transactionLogic, transactionPool, logger, db }: TransactionQueueScope) {
        this.scope.transactionLogic = transactionLogic;
        this.scope.transactionPool = transactionPool;
        this.scope.logger = logger;
        this.scope.db = db;
    }

    /**
     * used in:
     *  verify ?
     */
    pop(): Transaction {
        return this.queue.shift();
    }

    set(trs: Transaction): void {
        trs.status = TransactionStatus.QUEUED;
        this.queue.push(trs);
        if (this.queue.length === 1) {
            this.process();
        } else {
            this.queue.sort(transactionSortFunc);
        }
    }

    async process(): Promise<void> {
        if (this.queue.length >= 1) {
            const trs = this.pop();

            const sender = await getOrCreateAccount(this.scope.db, trs.senderPublicKey);
            this.scope.logger.info(`[TransactionQueue][process][sender] ${JSON.stringify(sender)}`);


            await this.processTrs(trs, sender);
            trs.status = TransactionStatus.PROCESSED;
            this.scope.logger.info(`TransactionStatus.PROCESSED ${JSON.stringify(trs)}`);

            const verifyStatus = await this.verify(trs, sender);

            if (verifyStatus.verified) {
                trs.status = TransactionStatus.VERIFIED;
                this.scope.logger.info(`TransactionStatus.VERIFIED ${JSON.stringify(trs)}`);
                await this.applyUnconfirmed(trs, sender);
                trs.status = TransactionStatus.UNCOFIRM_APPLIED;
                this.scope.logger.info(`TransactionStatus.UNCOFIRM_APPLIED ${JSON.stringify(trs)}`);
                this.scope.transactionPool.set(trs);
            } else {
                // notify in socket
            }
            this.scope.logger.info(`[TransactionQueue][process]`);
            this.process();
        }
    }

    async processTrs(trs: Transaction, sender: Account): Promise<void> {
        this.scope.transactionLogic.newProcess(trs, sender);
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
