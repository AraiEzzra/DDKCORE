import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';

class SystemController {
    constructor() {
        this.getAccountHistory = this.getAccountHistory.bind(this);
        this.getBlockHistory = this.getBlockHistory.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_ACCOUNT_HISTORY)
    @validate()
    public getAccountHistory(message: Message2<any>, socket: any): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_BLOCK_HISTORY)
    @validate()
    public getBlockHistory(message: Message2<any>, socket: any): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTION_HISTORY)
    @validate()
    public getTransactionHistory(message: Message2<any>, socket: any): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }
}

export default new SystemController();
