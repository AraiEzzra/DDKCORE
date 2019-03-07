import { Transaction, IAsset } from 'shared/model/transaction';
import {
    ITransactionRepository as ITransactionRepositoryShared,
    TransactionsByBlockResponse
} from 'shared/repository/transaction/transaction';

export interface ITransactionRepository<T extends IAsset> extends ITransactionRepositoryShared<T> {

}

class TransactionRepo implements ITransactionRepository<IAsset> {
    private readonly memoryTransactionByBlockId: { [blockId: string]: Array<Transaction<IAsset>> } = {};
    private readonly memoryTransactionById: { [transactionId: string]: Transaction<IAsset> } = {};

    add(trs: Transaction<IAsset>): Transaction<IAsset> {
        if (!this.memoryTransactionByBlockId[trs.blockId]) {
            this.memoryTransactionByBlockId[trs.blockId] = [];
        }
        this.memoryTransactionByBlockId[trs.blockId].push(trs);
        this.memoryTransactionById[trs.id] = trs;
        return trs;
    }

    delete(trs: Transaction<IAsset>): string {
        const blockTrs: Array<Transaction<IAsset>> = this.memoryTransactionByBlockId[trs.blockId];
        for (let i = 0; i < blockTrs.length; i++) {
            if (blockTrs[i].id === trs.id) {
                delete blockTrs[i];
                break;
            }
        }
        delete this.memoryTransactionById[trs.id];
        return trs.id;
    }

    public getAll(): Array<Transaction<IAsset>> {
        return Object.values(this.memoryTransactionById);
    }

    public getByBlockIds(blocksIds: Array<string>): TransactionsByBlockResponse {
        let result: TransactionsByBlockResponse = {};
        blocksIds.forEach((blockId: string) => {
            result[blockId] = this.memoryTransactionByBlockId[blockId];
        });
        return result;
    }

    public getById(transactionId: string): Transaction<IAsset> {
        if (this.memoryTransactionById[transactionId]) {
            return this.memoryTransactionById[transactionId].getCopy();
        }
        return;
    }

    public isExist(transactionId: string): boolean {
        return !!this.memoryTransactionById[transactionId];
    }
}

export default new TransactionRepo();
