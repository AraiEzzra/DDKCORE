import db, { pgpE } from 'shared/driver/db/index';
import { IAsset, Transaction } from 'shared/model/transaction';
import SharedTransactionPGRepo from 'shared/repository/transaction/pg';
import queries from 'core/repository/queries/transaction';
import { BlockId } from 'shared/repository/block';
import { RawTransaction, TransactionId } from 'shared/model/types';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';

export interface ITransactionPGRepository<T extends IAsset> {
    deleteById(trsId: TransactionId | Array<TransactionId>): Promise<ResponseEntity<Array<string>>>;
    getByBlockIds(blockIds: Array<BlockId>): Promise<ResponseEntity<{ [blockId: string]: Array<Transaction<IAsset>> }>>;
    getById(trsId: TransactionId): Promise<Transaction<T>>;
    getMany(limit: number, offset: number): Promise<Array<Transaction<T>>>;
    isExist(trsId: TransactionId): Promise<boolean>;
    save(trs: Transaction<T> | Array<Transaction<T>>): Promise<ResponseEntity<void>>;
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
        'fee',
        'salt',
        'asset',
    ];
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, {table: this.tableName});

    async deleteById(trsId: string | Array<string>): Promise<ResponseEntity<Array<string>>> {
        try {
            const response = await db.many(queries.deleteByIds, [trsId]);

            return new ResponseEntity({ data: response.map(item => item.id) });
        } catch (error) {
            logger.debug(`[Core][Repository][Transaction][deleteById] error.stack: ${error.stack}`);
            return new ResponseEntity({ errors: [`Unable to remove transactions. Error: ${error}`] });
        }
    }

    async getByBlockIds(
        blockIds: Array<string>,
    ): Promise<ResponseEntity<{ [blockId: string]: Array<Transaction<IAsset>> }>> {
        try {
            const rawTransactions: Array<RawTransaction> =
                await db.many(queries.getByBlockIds, [blockIds]);

            const result = {};
            rawTransactions.forEach((rawTransaction: RawTransaction) => {
                const transaction: Transaction<IAsset> = SharedTransactionPGRepo.deserialize(rawTransaction);
                if (!result[transaction.blockId]) {
                    result[transaction.blockId] = [];
                }
                result[transaction.blockId].push(transaction);
            });

            return new ResponseEntity({ data: result });
        } catch (error) {
            return new ResponseEntity({
                errors: [`Unable to load transactions by blocks ids from database. Error: ${error}`],
            });
        }
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

    createInsertQuery(transactions: Array<Transaction<IAsset>>) {
        const serializedTransactions = transactions
            .map((transaction) => SharedTransactionPGRepo.serialize(transaction));

        return pgpE.helpers.insert(serializedTransactions, this.columnSet);
    }

    async save(trs: Transaction<IAsset> | Array<Transaction<IAsset>>): Promise<ResponseEntity<void>> {
        const transactions: Array<Transaction<IAsset>> = [].concat(trs);
        const query = this.createInsertQuery(transactions);

        try {
            await db.query(query);
        } catch (error) {
            logger.debug(`[Core][Repository][Transaction][save] error.stack: ${error.stack}`);
            return new ResponseEntity({
                errors: [`Unable to save transactions to database. Error: ${error}`],
            });
        }

        return new ResponseEntity();
    }
}

export default new TransactionPGRepo();
