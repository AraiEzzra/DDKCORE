import { TransactionApi, IAsset } from 'shared/model/transaction';
import { ITransactionRepository } from 'shared/repository/transaction';
import { generateTrs } from 'api/mock/transactions';

class TransactionRepositoryImpl implements ITransactionRepository {

    getOne(id: string): TransactionApi<IAsset> {
        return;
    }

    getMany(limit: number, offset: number, sort?: string, type?: number): {
        transactions: Array<TransactionApi<IAsset>>
        total_count: number
    } {
        const transactions = generateTrs();
        return {
            transactions,
            total_count: transactions.length
        };
    }
}

export default new TransactionRepositoryImpl();
