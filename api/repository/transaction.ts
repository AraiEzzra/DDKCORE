import { generateTrs } from 'api/mock/transactions';
import Response from 'shared/model/response';
import { IAsset, TransactionApi } from 'shared/model/transaction';
import { resGetTransactions } from 'api/controller/transaction/types';

class TransactionRepository {

    getMany(data?: any): Response<resGetTransactions> {
        const trs = generateTrs();
        return new Response<resGetTransactions>({
            data: {
                trs,
                total_count: trs.length
            }
        });
    }

    getOne(data: string): Response<TransactionApi<IAsset>> {
        const trs: TransactionApi<IAsset> = generateTrs().find(item => item.id === data );
        return new Response<TransactionApi<IAsset>>({ data: trs });
    }
}

export default new TransactionRepository();
