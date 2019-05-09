import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

class SystemController {
    constructor() {
        this.getAccountHistory = this.getAccountHistory.bind(this);
        this.getBlockHistory = this.getBlockHistory.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_ACCOUNT_HISTORY)
    public getAccountHistory(message: Message2<any>, socket: SocketIO.Socket): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_BLOCK_HISTORY)
    public getBlockHistory(message: Message2<any>, socket: SocketIO.Socket): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTION_HISTORY)
    public getTransactionHistory(message: Message2<any>, socket: SocketIO.Socket): void {
        SocketMiddleware.emitToCore<any>(message, socket);
    }
}

export default new SystemController();
