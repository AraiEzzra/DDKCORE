import Response from 'shared/model/response';
import { reqGetTransactions, resGetTransactions, ITransaction } from 'api/controller/transaction/types';
import TransactionRepository from 'api/repository/transaction';
import TransactionService from 'api/service/transaction';
import { RPC } from 'api/utils/decorators';

class TransactionController {

    @RPC('GET_ALL_TRS_HISTORY')
    getTransactions(data?: reqGetTransactions) {
        return TransactionService.getMany(data.limit, data.offset, data.sort, data.type);
    }

    @RPC('GET_TRS_HISTORY')
    public getTransaction(data: string) {
        return TransactionRepository.getOne(data);
    }

    @RPC('CREATE_TRS')
    public createTransaction(data: any): void {
        /**TODO */
        TransactionService.createTransaction(data);
    }
}

export default new TransactionController();
