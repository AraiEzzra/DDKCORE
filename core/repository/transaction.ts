const Inserts = require('../../backlog/helpers/inserts.js');
import db from 'shared/driver/db';
import { Transaction } from 'shared/model/transaction';
import { ITransactionRepository as ITransactionRepositoryShared } from 'shared/repository/transaction';
import Response from 'shared/model/response';
import {logger} from 'shared/util/logger';

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

class TransactionRepo implements ITransactionRepository<object> {
    one(): Promise<Transaction<object>> {
        return null;
    }

    many(): Promise<Transaction<object>> {
        return null;
    }

    list(): Array<Transaction<object>> { return undefined; }

    dbSave(trs: Transaction<object>): IDBTransactionSave { return undefined; }

    public saveTransaction = async (transaction): Promise<Response<void>> => {
        try {
            await db.tx(async (t) => {
                const promise = await this.dbSave(transaction);
                const inserts = new Inserts(promise, promise.values);
                const promises = t.none(inserts.template(), promise.values);
                await t.batch(promises);
            });
        } catch (error) {
            logger.error(`[Chain][saveTransaction][tx]: ${error}`);
            logger.error(`[Chain][saveTransaction][tx][stack]:\n${error.stack}`);
        }
        return new Response<void>();
    }
}

export default new TransactionRepo();
