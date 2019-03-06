import db from 'shared/driver/db';
import { Transaction, IAsset } from 'shared/model/transaction';
import { ITransactionRepository as ITransactionRepositoryShared } from 'shared/repository/transaction';
import Response from 'shared/model/response';
import {logger} from 'shared/util/logger';
import queries from 'core/repository/queries/transaction';

interface IDBTransactionSave {
    table: string;
    fields: string[];
    values: object;
}

export interface ITransactionRepository<T extends Object> extends ITransactionRepositoryShared<T> {
    list(): Array<Transaction<T>>;

    getTransactionsForBlocksByIds(ids: Array<string>): Response<{ [blockId: string]:  Array<Transaction<object>> }>;

    getTotalCountTransactions(): Promise<Response<number>>;

    getTransactionBatch(limit: number, offset: number): Promise<Response<Array<Transaction<any>>>>;
}

class TransactionRepo implements ITransactionRepository<object> {
    private readonly memoryTransactionByBlockId: { [blockId: string]: Array<Transaction<Object>> } = {};
    private readonly memoryTransactionById: { [transactionId: string]: Transaction<Object> } = {};

    public getTransactionsForBlocksByIds(blocksIds: Array<string>):
        Response<{ [blockId: string]:  Array<Transaction<object>> }> {
        let result: { [blockId: string]:  Array<Transaction<object>> } = {};
        blocksIds.forEach((blockId: string) => {
            result[blockId] = this.memoryTransactionByBlockId[blockId];
        });
        return new Response({ data: result });
    }

    public isExist(transactionId: string): boolean {
        return !!this.memoryTransactionById[transactionId];
    }

    public getById(transactionId: string): Transaction<IAsset> {
        if (this.memoryTransactionById[transactionId]) {
            return this.memoryTransactionById[transactionId].getCopy();
        }

        return;
    }

    public getAll() {
        return Object.values(this.memoryTransactionById);
    }

    one(): Promise<Transaction<object>> {
        return null;
    }

    // async  getTransactionsForBlocksByIds(blocksIds: Array<string>):
    //     Promise<Response<{ [blockId: string]:  Array<Transaction<object>> }>> {
    //     let result: { [blockId: string]:  Array<Transaction<object>> } = {};
    //     try {
    //         const rawTransactions: Array<object> =
    //             await db.manyOrNone(queries.getTransactionsForBlocksByIds, [blocksIds]);
    //         if (!rawTransactions) {
    //             return new Response({ data: {}});
    //         }
    //         rawTransactions.forEach((rawTransaction) =>  {
    //             const transaction: Transaction<object> = this.dbRead(rawTransaction);
    //             if (!result[transaction.blockId]) {
    //                 result[transaction.blockId] = [];
    //             }
    //             result[transaction.blockId].push(transaction);
    //         });
    //     } catch (pgError) {
    //         return new Response({ errors: [pgError]});
    //     }
    //     return new Response({ data: result });
    // }

    public dbRead(raw: {[key: string]: any}, radix: number = 10): Transaction<object> {
        if (!raw.id) {
            return null;
        }

        const transaction: Transaction<object> = new Transaction({
            id: raw.id,
            blockId: raw.block_id,
            type: parseInt(raw.type, radix),
            createdAt: parseInt(raw.created_at, radix),
            senderPublicKey: raw.sender_public_key,
            senderAddress: parseInt(raw.sender_address, radix),
            recipientAddress: parseInt(raw.recipient_address, radix),
            amount: parseInt(raw.amount, radix),
            fee: parseInt(raw.fee, radix),
            signature: raw.signature,
            secondSignature: raw.second_signature,
            salt: raw.salt,
            asset: raw.asset,
        });
        return transaction;
    }

    many(): Promise<Transaction<object>> {
        return null;
    }

    list(): Array<Transaction<object>> { return undefined; }

    dbSave(trs: Transaction<object>): IDBTransactionSave { return undefined; }

    public saveTransaction = async (transaction: Transaction<object>): Promise<Response<void>> => {
        // try {
        //     await db.tx(async (t) => {
        //         const promise = await this.dbSave(transaction);
        //         const inserts = new Inserts(promise, promise.values);
        //         const promises = t.none(inserts.template(), promise.values);
        //         await t.batch(promises);
        //     });
        // } catch (error) {
        //     logger.error(`[Chain][saveTransaction][tx]: ${error}`);
        //     logger.error(`[Chain][saveTransaction][tx][stack]:\n${error.stack}`);
        // }
        // return new Response<void>();
        if (!this.memoryTransactionByBlockId[transaction.blockId]) {
            this.memoryTransactionByBlockId[transaction.blockId] = [];
        }
        this.memoryTransactionByBlockId[transaction.blockId].push(transaction);
        this.memoryTransactionById[transaction.id] = transaction;
        return new Response<void>();
    }

    async getTotalCountTransactions(): Promise<Response<number>> {
        const res = await db.one(queries.getTotalCountTransactions);
        return new Response<number>({data: res.count});
    }

    async getTransactionBatch(limit: number, offset: number): Promise<Response<Array<Transaction<IAsset>>>> {
        const trs:  Array<Transaction<IAsset>> = await db.manyOrNone(queries.getTransactionBatch, { limit, offset});
        return new Response({data: trs || []});
    }
}

export default new TransactionRepo();
