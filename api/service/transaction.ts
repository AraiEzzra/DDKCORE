import {IAsset, TransactionApi } from 'shared/model/transaction';
import TransactionRepository from 'shared/repository/transaction/memory';
import Response from 'shared/model/response';

import { resGetTransactions } from 'api/controller/transaction/types';

interface ITransactionService {
    createTransaction(data: any);
    getMany(limit: number, offset: number, sort?: string, type?: number): Response<resGetTransactions>;
}

class TransactionService implements ITransactionService{

    createTransaction(data: any) {}

    getMany(limit: number, offset: number, sort?: string, type?: number): Response<resGetTransactions> {
        const trs = TransactionRepository.getMany(limit, offset, sort, type);
        return new Response<resGetTransactions>({ data: trs });
    }
}

export default new TransactionService();
