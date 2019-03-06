import { Transaction, TransactionType } from 'shared/model/transaction';
import { IListContainer } from '../util/common';
import Response from 'shared/model/response';
import TransactionRepository from '../repository/transaction';
import TransactionService from '../service/transaction';

export interface ITransactionRequest {
    limit: number;
    offset: number;
    sort?: string;
    type?: TransactionType;
}

@Controller('transaction')
class TransactionController {

    @SOCKET('get_many')
    getTransactions(data?: ITransactionRequest) {
        const trs: Response<IListContainer<Transaction>> = TransactionRepository.getMany(data);
        return trs.data;
    }

    @SOCKET('get_one')
    @validate('getTransaction')
    public getTransaction(data: string) {
        const trs: Response<Transaction> = TransactionRepository.getOne(data);
        return trs.data;
    }

    @SOCKET('create')
    @validate('createTransaction')
    public createTransaction(data: any): void {
        /**TODO */
        TransactionService.createTransaction(data);
    }
}

export default new TransactionController();
