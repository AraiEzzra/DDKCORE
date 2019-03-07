import { IAsset, Transaction } from 'shared/model/transaction';
import TransactionRepository from 'shared/repository/transaction/memory';
import ResponseEntity from 'shared/model/response';

interface ITransactionService {
    createTransaction(data: any);
    getMany(limit: number, offset: number, sort?: string, type?: number): ResponseEntity<Array<Transaction<IAsset>>>;
    getOne(data: string): ResponseEntity<Transaction<IAsset>>;
}

class TransactionService implements ITransactionService {

    createTransaction(data: any) {}

    getMany(limit: number, offset: number, sort?: string, type?: number): ResponseEntity<Array<Transaction<IAsset>>> {
        const trs: Array<Transaction<IAsset>> = TransactionRepository.getMany(limit, offset, sort, type);
        return new ResponseEntity({ data: trs });
    }

    getOne(data: string): ResponseEntity<Transaction<IAsset>> {
        const trs = TransactionRepository.getOne(data);
        return new ResponseEntity({data: trs});
    }
}

export default new TransactionService();
