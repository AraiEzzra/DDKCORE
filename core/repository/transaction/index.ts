import { IAsset, Transaction } from 'shared/model/transaction';
import { TransactionId } from 'shared/model/types';
import { Address } from 'shared/model/types';

export interface ITransactionRepository<T extends IAsset> {
    add(trs: Transaction<T>): Transaction<T>;
    delete(trs: Transaction<T>): void;
    isExist(trsId: TransactionId): boolean;
    getById(transactionId: string): Transaction<IAsset>;
    size(): number;
}

class TransactionRepo implements ITransactionRepository<IAsset> {
    private readonly memoryTransactionsById: Map<TransactionId, Transaction<IAsset>> = new Map();

    add(trs: Transaction<IAsset>): Transaction<IAsset> {
        this.memoryTransactionsById.set(trs.id, trs);
        return trs;
    }

    delete(trs: Transaction<IAsset>): void {
        this.memoryTransactionsById.delete(trs.id);
    }

    public isExist(id: TransactionId): boolean {
        return !!this.memoryTransactionsById[id];
    }

    public getById(id: TransactionId): Transaction<IAsset> {
        return this.memoryTransactionsById.get(id);
    }
    
    /* Only for system usage */
    public getByAddress(address: Address): Array<Transaction<IAsset>> {
        const filteredTransaction = [];
        for (const trs of this.memoryTransactionsById.values()) {
            if (trs.senderAddress === address) {
                filteredTransaction.push(trs);
            }
        }
        return filteredTransaction;
    }
    
    size() {
        return this.memoryTransactionsById.size;
    }
}

export default new TransactionRepo();
