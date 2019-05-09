import { IAsset, Transaction } from 'shared/model/transaction';
import {
    ITransactionRepository as ITransactionRepositoryShared,
    TransactionsByBlockResponse
} from 'shared/repository/transaction';

export interface ITransactionRepository<T extends IAsset> extends ITransactionRepositoryShared<T> {

}

class TransactionRepo implements ITransactionRepository<IAsset> {
    private readonly memoryTransactionById: { [transactionId: string]: Transaction<IAsset> } = {};

    add(trs: Transaction<IAsset>): Transaction<IAsset> {
        this.memoryTransactionById[trs.id] = trs;
        return trs;
    }

    delete(trs: Transaction<IAsset>): string {
        delete this.memoryTransactionById[trs.id];
        return trs.id;
    }

    public isExist(transactionId: string): boolean {
        return !!this.memoryTransactionById[transactionId];
    }

    public getById(id: string): Transaction<IAsset> {
        return this.memoryTransactionById[id];
    }
}

export default new TransactionRepo();
