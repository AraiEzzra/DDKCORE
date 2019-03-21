import { RPC } from 'api/utils/decorators';
import { Message2 } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { GET_ACCOUNT, GET_ACCOUNT_BALANCE } from 'shared/driver/socket/codes';

export class AccountController {

    constructor() {
        this.getAccount = this.getAccount.bind(this);
        this.getAccountBalance = this.getAccountBalance.bind(this);
    }

    @RPC(GET_ACCOUNT)
    getAccount(message: Message2<{ address: string }>, socket: any) {
        SocketMiddleware.emitToCore<{ address: string }>(message, socket);
    }

    @RPC(GET_ACCOUNT_BALANCE)
    getAccountBalance(message: Message2<{ address: string }>, socket: any) {
        SocketMiddleware.emitToCore<{ address: string }>(message, socket);
    }

}

export default new AccountController();
