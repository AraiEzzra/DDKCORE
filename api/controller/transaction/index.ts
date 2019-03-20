import { Filter } from 'api/controller/transaction/types';
import TransactionService from 'api/service/transaction';
import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';
import {
    CREATE_TRANSACTION,
    GET_TRANSACTION_BY_ID,
    GET_TRANSACTION,
    GET_TRANSACTION_HISTORY,
    GET_TRANSACTIONS_BY_BLOCK_ID
} from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';
import { SCHEMA_CREATE_TRANSACRION } from 'shared/validate/schema/transaction';

export class TransactionController {

    constructor() {
        this.createTransaction = this.createTransaction.bind(this);
        // this.getTransactions = this.getTransactions.bind(this);
        // this.getTransactionById = this.getTransactionById.bind(this);
        // this.getTransactions = this.getTransactions.bind(this);
        // this.getTransactionsByBlockId = this.getTransactionsByBlockId.bind(this);
    }

    @RPC(CREATE_TRANSACTION)
    @validate(SCHEMA_CREATE_TRANSACRION)
    createTransaction(message: Message, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }


    // @RPC(GET_TRANSACTION)
    // getTransaction(message: Message, socket: any) {
    //     const { body, headers, code } = message;
    //
    //     const transactionResponse = TransactionService.getOne(body);
    //     SocketMiddleware.emitToClient(headers.id, code, transactionResponse, socket);
    // }
    //
    // @RPC(GET_TRANSACTION_BY_ID)
    // getTransactionById(message: Message, socket: any) {
    //
    // }
    //
    // @RPC(GET_TRANSACTION_HISTORY)
    // getTransactions(message: Message, socket: any) {
    //     const { body, headers, code } = message;
    //     const transactionsResponse = TransactionService.getMany(body.limit, body.offset, body.sort, body.type);
    // }
    //
    //
    // @RPC(GET_TRANSACTIONS_BY_BLOCK_ID)
    // getTransactionsByBlockId(blockId: number, filter: Filter) {
    //     return TransactionService.getTrsByBlockId(blockId, filter.limit, filter.offset);
    // }
}

export default new TransactionController();
