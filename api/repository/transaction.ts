import { IAsset, TransactionApi } from 'shared/model/transaction';
import { generateTrs } from 'api/mock/transactions';

interface ITransactionRepository {
    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): Array<TransactionApi<IAsset>>;

    getTrsByBlockId(blockId: number, limit: number, offset: number): Array<TransactionApi<IAsset>>;
}

class TransactionRepository implements ITransactionRepository {

    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): Array<TransactionApi<IAsset>> {
        const transactions: Array<TransactionApi<IAsset>> = generateTrs();
        return transactions;
    }

    getTrsByBlockId(blockId: number, limit: number, offset: number): Array<TransactionApi<IAsset>> {
        const transactions: Array<TransactionApi<IAsset>> = generateTrs();
        return transactions;
    }
}

export default new TransactionRepository();
