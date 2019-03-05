import { generateTrs } from '../mock/transactions';
import { IListContainer } from '../util/common';
import Response from 'shared/model/response';
import { IAsset, Transaction } from 'shared/model/transaction';

class TransactionRepository {

    getMany(data?: any): Response<IListContainer<Transaction<IAsset>>> {
        const trs = generateTrs();
        return new Response<IListContainer<Transaction<IAsset>>>({
            data: {
                data: trs,
                total_count: trs.length
            }
        });
    }

    getOne(data: string): Response<Transaction<IAsset>> {
        const trs: Transaction<IAsset> = generateTrs().find(item => item.id === data );
        return new Response<Transaction<IAsset>>({ data: trs });
    }
}

export default new TransactionRepository();
