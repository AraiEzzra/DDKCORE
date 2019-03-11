import ResponseEntity from 'shared/model/response';
import { Filter } from 'api/controller/transaction/types';
import TransactionService from 'api/service/transaction';
import { RPC } from 'api/utils/decorators';

export class TransactionController {

    @RPC('GET_ALL_TRS_HISTORY')
    getTransactions(data?: Filter) {
        return TransactionService.getMany(data.limit, data.offset, data.sort, data.type);
    }

    @RPC('GET_TRS')
    public getTransaction(data: string) {
        return TransactionService.getOne(data);
    }

    @RPC('CREATE_TRS')
    public createTransaction(data: any): void {
        /**TODO */
        TransactionService.createTransaction(data);
    }

    @RPC('GET_TRS_BY_BLOCK_ID)')
    getTransactionsByBlockId(blockId: number,  filter: Filter) {
        return TransactionService.getTrsByBlockId(blockId, filter.limit, filter.offset);
    }
}

export default new TransactionController();
