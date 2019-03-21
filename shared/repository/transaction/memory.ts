import { Transaction, TransactionApi, IAsset } from 'shared/model/transaction';
import { ITransactionRepository,
         DeletedTransactionId,
         TransactionId,
         BlockId,
         TransactionsByBlockResponse } from 'shared/repository/transaction';

class TransactionRepositoryImpl implements ITransactionRepository<IAsset> {

    getOne(id: string): TransactionApi<IAsset> {
        // const trs: TransactionApi<IAsset> = generateTrs().find(item => item.id === id);
        return undefined;
    }

    add(trs: Transaction<IAsset>): Transaction<IAsset> {
        return;
    }

    delete(trs: Transaction<IAsset>): DeletedTransactionId {
        return undefined;
    }

    getAll(): Array<Transaction<IAsset>> {
        return undefined;
    }

    getByBlockIds(blockIds: Array<BlockId>): TransactionsByBlockResponse {
        return undefined;
    }

    getById(trsId: TransactionId): Transaction<IAsset> {
        return undefined;
    }

    isExist(trsId: TransactionId): boolean {
        return false;
    }

}

export default new TransactionRepositoryImpl();
