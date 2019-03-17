import AccountService from 'api/service/account';
import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { GET_ACCOUNT_BY_ADDRESS, GET_ACCOUNT_BY_PUBLIC_KEY } from 'shared/driver/socket/codes';

export class AccountController {

    constructor() {
        this.getAccountByAddress = this.getAccountByAddress.bind(this);
        this.getAccountByPublicKey = this.getAccountByPublicKey.bind(this);
    }

    @RPC(GET_ACCOUNT_BY_ADDRESS)
    getAccountByAddress(message: Message, socket: any) {
        const { body, headers, code } = message;
        const accountsResponse = AccountService.getAccountByAddress(body.address);

        accountsResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, accountsResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(GET_ACCOUNT_BY_PUBLIC_KEY)
    getAccountByPublicKey(message: Message, socket: any) {
        const { body, headers, code } = message;
        const accountsResponse = AccountService.getAccountByPublicKey(body.publicKey);

        accountsResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, accountsResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }
}

export default new AccountController();
