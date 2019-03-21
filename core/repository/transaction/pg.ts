import db, { pgpE } from 'shared/driver/db/index';
import { IAsset, Transaction } from 'shared/model/transaction';
import {
    ITransactionPGRepository as ITransactionPGRepositoryShared,
    RawTransaction,
    TransactionsByBlockResponse
} from 'shared/repository/transaction';
import SharedTransactionPGRepo from 'shared/repository/transaction/pg';
import queries from 'core/repository/queries/transaction';

export interface ITransactionPGRepository<T extends IAsset> extends ITransactionPGRepositoryShared<T> {

}

class TransactionPGRepo implements ITransactionPGRepository<IAsset> {
    private readonly tableName: string = 'trs';
    private readonly tableFields: Array<string> = [
        'id',
        'block_id',
        'type',
        'created_at',
        'sender_public_key',
        'signature',
        'second_signature',
        'salt',
        'asset'
    ];
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, {table: this.tableName});

    async deleteById(trsId: string | Array<string>): Promise<void> {
        await db.none(queries.deleteByIds, [trsId]);
    }

    async getByBlockIds(blockIds: Array<string>): Promise<TransactionsByBlockResponse> {
        let result: TransactionsByBlockResponse = {};
        const rawTransactions: Array<RawTransaction> =
            await db.manyOrNone(queries.getByBlockIds, [blockIds]);
        if (!rawTransactions) {
            return result;
        }
        rawTransactions.forEach((rawTransaction: RawTransaction) =>  {
            const transaction: Transaction<IAsset> = SharedTransactionPGRepo.deserialize(rawTransaction);
            if (!result[transaction.blockId]) {
                result[transaction.blockId] = [];
            }
            result[transaction.blockId].push(transaction);
        });
        return result;
    }

    async getById(trsId: string): Promise<Transaction<IAsset>> {
        const rawTransaction: RawTransaction = await db.oneOrNone(queries.getById, { id: trsId });
        if (!rawTransaction) {
            return;
        }
        return SharedTransactionPGRepo.deserialize(rawTransaction);
    }

    async getMany(limit: number, offset: number): Promise<Array<Transaction<IAsset>>> {
        let result: Array<Transaction<IAsset>> = [];
        const rawTransactions:  Array<RawTransaction> =
            await db.manyOrNone(queries.getTransactionBatch, { limit, offset });
        if (!rawTransactions) {
            return result;
        }
        rawTransactions.forEach((rawTransaction: RawTransaction) => {
            result.push(SharedTransactionPGRepo.deserialize(rawTransaction));
        });
        return result;
    }

    async isExist(trsId: string): Promise<boolean> {
        const transaction: Transaction<IAsset> = await this.getById(trsId);
        return !!transaction;
    }

    async saveOrUpdate(trs: Transaction<IAsset> | Array<Transaction<IAsset>>): Promise<void> {
        const transactions: Array<Transaction<IAsset>> = [].concat(trs);
        const values: Array<object> = [];
        transactions.forEach((transaction) => {
            values.push(SharedTransactionPGRepo.serialize(transaction));
        });
        const query = pgpE.helpers.insert(values, this.columnSet) +
            ' ON CONFLICT(id) DO UPDATE SET ' +
            this.columnSet.assignColumns({from: 'EXCLUDED', skip: 'id'});
        await db.none(query);
        return null;
    }
}

export default new TransactionPGRepo();
