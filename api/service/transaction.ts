import {IAsset, Transaction, TransactionModel, TransactionApi } from 'shared/model/transaction';
import SharedTransactionRepository from 'shared/repository/transaction/memory';
import TransactionRepository from 'api/repository/transaction';
import { Filter } from 'api/controller/transaction/types';
import ResponseEntity from 'shared/model/response';
import { TransactionsByBlockResponse } from 'shared/repository/transaction';

interface ITransactionService {
    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): ResponseEntity<Array<TransactionModel<IAsset>>>;

    getOne(data: string): ResponseEntity<Transaction<IAsset>>;
    getTrsByBlockId(blockId: number, limit: number, offset: number);

}

class TransactionService implements ITransactionService {

    createTransaction(data: any) {}

    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): ResponseEntity<Array<TransactionApi<IAsset>>> {
        const trs: Array<TransactionApi<IAsset>> = TransactionRepository.getMany(limit, offset, sort, type);
        return new ResponseEntity({ data: trs });
    }

    getOne(data: string): ResponseEntity<Transaction<IAsset>> {
        const trs = SharedTransactionRepository.getOne(data);
        return new ResponseEntity({ data: trs });
    }

    getTrsByBlockId(blockId: number, limit: number, offset: number): ResponseEntity<Array<TransactionApi<IAsset>>> {
        const trs: Array<TransactionApi<IAsset>> = TransactionRepository.getTrsByBlockId(blockId, limit, offset);
        return new ResponseEntity({ data: trs });
    }
}

export default new TransactionService();
