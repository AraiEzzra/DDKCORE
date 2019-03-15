import {IAsset, TransactionModel, TransactionType } from 'shared/model/transaction';
import SharedTransactionRepository from 'shared/repository/transaction/memory';
import TransactionRepository from 'api/repository/transaction';
import { ResponseEntity } from 'shared/model/response';

interface ITransactionService {
    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): ResponseEntity<Array<TransactionModel<IAsset>>>;

    getOne(data: string): ResponseEntity<TransactionModel<IAsset>>;
    getTrsByBlockId(blockId: number, limit: number, offset: number);
    createTransaction(trs: TransactionModel<IAsset>): ResponseEntity<void>;
}

class TransactionService implements ITransactionService {

    createTransaction(trs: TransactionModel<IAsset>): ResponseEntity<void> {
        if (!trs.type || !TransactionType[trs.type]) {
            return new ResponseEntity({
                errors: ['Not Valid transaction']
            });
        }
        return new ResponseEntity();
    }

    getMany(limit: number,
            offset: number,
            sort?: string,
            type?: number): ResponseEntity<Array<TransactionModel<IAsset>>> {
        const trs: Array<TransactionModel<IAsset>> = TransactionRepository.getMany(limit, offset, sort, type);
        return new ResponseEntity({ data: trs });
    }

    getOne(id: string): ResponseEntity<TransactionModel<IAsset>> {
        const trs = SharedTransactionRepository.getOne(id);
        return new ResponseEntity({ data: trs });
    }

    getTrsByBlockId(blockId: number, limit: number, offset: number): ResponseEntity<Array<TransactionModel<IAsset>>> {
        const trs: Array<TransactionModel<IAsset>> = TransactionRepository.getTrsByBlockId(blockId, limit, offset);
        return new ResponseEntity({ data: trs });
    }
}

export default new TransactionService();
