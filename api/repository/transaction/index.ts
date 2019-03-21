import { IAsset, Transaction } from 'shared/model/transaction';
import db from 'shared/driver/db';
import query from 'api/repository/transaction/query';
import { Sort } from 'api/utils/common';
import SharedTransactionPGRepo from 'shared/repository/transaction/pg';
import { toSnakeCase } from 'shared/util/util';


class TransactionPGRepository {

    async getOne(id: string): Promise<Transaction<IAsset>> {
        return SharedTransactionPGRepo.deserialize(await db.oneOrNone(query.getTransaction, { id }));
    }

    async getMany(filter: any, sort: Array<Sort>, limit: number, offset: number): Promise<Array<Transaction<IAsset>>> {
        const transactions = await db.manyOrNone(
            query.getTransactions(filter, sort.map(elem => `${toSnakeCase(elem[0])} ${elem[1]}`).join(', ')), {
                ...filter,
                limit,
                offset
            });
        return transactions.map(trs => SharedTransactionPGRepo.deserialize(trs));
    }
}

export default new TransactionPGRepository();
