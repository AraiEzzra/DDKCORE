import { TransactionApi, Transaction IAsset } from 'shared/model/transaction';
import { ITransactionRepository } from 'shared/repository/transaction';
import { generateTrs } from 'api/mock/transactions';

class TransactionRepositoryImpl implements ITransactionRepository<IAsset> {

    getOne(id: string): TransactionApi<IAsset> {
        const trs: TransactionApi<IAsset> = generateTrs().find(item => item.id === id);
        return trs;
    }

    getMany(limit: number, offset: number, sort?: string, type?: number): Array<Transaction<IAsset>> {
        const transactions: Array<TransactionApi<IAsset>> = generateTrs();
        return transactions;
    }
}

export default new TransactionRepositoryImpl();
