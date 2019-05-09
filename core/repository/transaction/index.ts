import { IAsset, Transaction } from 'shared/model/transaction';
import { TransactionId } from 'shared/model/types';

export interface ITransactionRepository<T extends IAsset> {
    add(trs: Transaction<T>): Transaction<T>;
    delete(trs: Transaction<T>): void;
    isExist(trsId: TransactionId): boolean;
    getById(transactionId: string): Transaction<IAsset>;
}

class TransactionRepo implements ITransactionRepository<IAsset> {
    private readonly memoryTransactionById: Map<TransactionId, Transaction<IAsset>> = new Map();

    add(trs: Transaction<IAsset>): Transaction<IAsset> {
        this.memoryTransactionById.set(trs.id, trs);
        return trs;
    }

    delete(trs: Transaction<IAsset>): void {
        this.memoryTransactionById.delete(trs.id);
    }

    public isExist(id: TransactionId): boolean {
        return !!this.memoryTransactionById[id];
    }

    public getById(id: TransactionId): Transaction<IAsset> {
        return this.memoryTransactionById.get(id);
    }
}

export default new TransactionRepo();
