import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';
import { Pagination } from 'shared/util/common';

class SystemController {
    constructor() {
        this.getAccountHistory = this.getAccountHistory.bind(this);
        this.getBlockHistory = this.getBlockHistory.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
        this.getAllUnconfirmedTransactions = this.getAllUnconfirmedTransactions.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_ACCOUNT_HISTORY)
    @validate()
    public getAccountHistory(message: Message<any>, socket: any): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_BLOCK_HISTORY)
    @validate()
    public getBlockHistory(message: Message<any>, socket: any): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTION_HISTORY)
    @validate()
    public getTransactionHistory(message: Message<any>, socket: any): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_ALL_UNCONFIRMED_TRANSACTIONS)
    @validate()
    public getAllUnconfirmedTransactions(message: Message<Pagination>, socket: any): void {
        SocketMiddleware.emitToCore<Pagination>(message, socket);
    }

}

export default new SystemController();
