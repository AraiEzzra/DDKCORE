const Inserts = require('../../backlog/helpers/inserts.js');
import db from 'shared/driver/db';
import { Transaction } from 'shared/model/transaction';
import { ITransactionRepository as ITransactionRepositoryShared } from 'shared/repository/transaction';

// wait declare by @Fisenko
declare class Account {
}

interface IDBTransactionSave {
    table: string;
    fields: string[];
    values: object;
}

export interface ITransactionRepository<T extends Object> extends ITransactionRepositoryShared<T> {
    list(): Array<Transaction<T>>;
}

export class TransactionRepo implements ITransactionRepository<object> {
    one(): Promise<Transaction<object>> {
        return null;
    }

    many(): Promise<Transaction<object>> {
        return null;
    }

    list(): Array<Transaction<object>> { return undefined; }

    dbSave(trs: Transaction<object>): IDBTransactionSave { return undefined; }

    public saveTransaction = async (transaction) => {
        try {
            await db.tx(async (t) => {
                const promise = await this.dbSave(transaction);
                const inserts = new Inserts(promise, promise.values);
                const promises = t.none(inserts.template(), promise.values);
                await t.batch(promises);
            });
        } catch (error) {
            library.logger.error(`[Chain][saveTransaction][tx]: ${error}`);
            library.logger.error(`[Chain][saveTransaction][tx][stack]:\n${error.stack}`);
        }
    }
}
