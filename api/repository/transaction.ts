import { mockTransactions } from '../mock/transactions';
import { IListContainer } from '../util/common';
import Response from 'shared/model/response';
import { Transaction } from 'shared/model/transaction';

class TransactionRepository {

    getMany(data?: any): Response<IListContainer<Array<Transaction>>> {
        /**TODO need to RPC request to CORE*/
        return new Response<IListContainer<Transaction>>({
            data: mockTransactions,
            total_count: mockTransactions.length
        });
    }

    getOne(data: string): Response<Transaction> {
        /**TODO need to RPC request to CORE*/
        const trs = mockTransactions.filter((item: Transaction) => item.id === data );
        return new Response<Transaction>(trs[0]);
    }
}

export default new TransactionRepository();
