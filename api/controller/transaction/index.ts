import { ResponseEntity } from 'shared/model/response';
import TransactionService from 'api/service/transaction';
import { Message } from 'shared/model/message';
import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import {IAsset, TransactionModel} from 'shared/model/transaction';

export class TransactionController {

    @RPC('GET_ALL_TRS_HISTORY')
    getTransactions(message: Message, socketApi: any) {
        const { body, headers, code } = message;

        const transactions: ResponseEntity<Array<TransactionModel<IAsset>>> =
            TransactionService.getMany(body.limit, body.offset, body.sort, body.type);
        transactions.success
            ? SocketMiddleware.emitToClient(headers.id, code, transactions.data, socketApi)
            : SocketMiddleware.emitToClient(headers.id, code, transactions.errors, socketApi);
    }

    @RPC('GET_TRS')
    public getTransaction(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const transaction: ResponseEntity<TransactionModel<IAsset>> =  TransactionService.getOne(body);
        transaction.success
            ? SocketMiddleware.emitToClient(headers.id, code, transaction.data, socketApi)
            : SocketMiddleware.emitToClient(headers.id, code, transaction.errors, socketApi);
    }

    @RPC('GET_TRS_BY_BLOCK_ID')
    getTransactionsByBlockId(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const arrayTransactions: ResponseEntity<Array<TransactionModel<IAsset>>> =
            TransactionService.getTrsByBlockId(body.blockId, body.limit, body.offset);

        arrayTransactions.success
            ? SocketMiddleware.emitToClient(headers.id, code, arrayTransactions.data, socketApi)
            : SocketMiddleware.emitToClient(headers.id, code, arrayTransactions.errors, socketApi);
    }

    @RPC('TRANSACTION_CREATE')
    public createTransaction(message: Message, socketApi: any): void {
        const { body, headers, code } = message;
        const newTransaction: ResponseEntity<void> = TransactionService.createTransaction(body);
        newTransaction.success
            ? SocketMiddleware.emitToCore(message, socketApi)
            : SocketMiddleware.emitToClient(headers.id, code, newTransaction.errors, socketApi);
    }
}

export default new TransactionController();
