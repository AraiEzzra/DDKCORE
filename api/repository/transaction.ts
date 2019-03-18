import {IAsset, TransactionModel} from 'shared/model/transaction';
import { generateTrs } from 'api/mock/transactions';

interface ITransactionRepository {
    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): Array<TransactionModel<IAsset>>;

    getTrsByBlockId(blockId: number, limit: number, offset: number): Array<TransactionModel<IAsset>>;
}

class TransactionRepository implements ITransactionRepository {

    private readonly transactions: Array<TransactionModel<IAsset>>; // mock for wallet

    constructor() {
        this.transactions = generateTrs();
    }

    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): Array<TransactionModel<IAsset>> {
        const transactions: Array<TransactionModel<IAsset>> = this.transactions;
        return transactions;
    }

    getTrsByBlockId(blockId: number, limit: number, offset: number): Array<TransactionModel<IAsset>> {
        const transactions: Array<TransactionModel<IAsset>> = this.transactions;
        return transactions;
    }
}

export default new TransactionRepository();
