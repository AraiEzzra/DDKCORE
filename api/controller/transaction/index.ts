import {IAsset, Transaction, TransactionType} from 'shared/model/transaction';
import { IListContainer } from '../../util/common';
import Response from 'shared/model/response';
import TransactionRepository from '../../repository/transaction';
import TransactionService from '../../service/transaction';
import { RPC, SOCKET, VALIDATE, CONTROLLER } from 'api/utils/decorators';
import { ITransactionRequest } from './interface';

@CONTROLLER('transaction')
class TransactionController {

    @RPC('GET_ALL_TRS_HISTORY')
    @SOCKET('get_many')
    getTransactions(data?: ITransactionRequest) {
        const trs: Response<IListContainer<Transaction<IAsset>>> = TransactionRepository.getMany(data);
        return trs.data;
    }

    @RPC('GET_TRS_HISTORY')
    @SOCKET('GET_ONE')
    @VALIDATE('getTransaction')
    public getTransaction(data: string) {
        const trs: Response<Transaction<IAsset>> = TransactionRepository.getOne(data);
        return trs.data;
    }

    @SOCKET('CREATE')
    @VALIDATE('createTransaction')
    public createTransaction(data: any): void {
        /**TODO */
        TransactionService.createTransaction(data);
    }
}

export default new TransactionController();
