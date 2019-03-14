import AccountService from 'api/service/account';
import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';

export class AccountController {

    constructor() {
        this.getAccountByAddress = this.getAccountByAddress.bind(this);
        this.getAccountByPublicKey = this.getAccountByPublicKey.bind(this);
    }

    @RPC('GET_ACCOUNT_BY_ADDRESS')
    getAccountByAddress(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accountsResponse = AccountService.getAccountByAddress(body.address);

        accountsResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, accountsResponse, socketApi)
            : SocketMiddleware.emitToCore(message, socketApi);
    }

    @RPC('GET_ACCOUNT_BY_PUBLIC_KEY')
    getAccountByPublicKey(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accountsResponse = AccountService.getAccountByPublicKey(body.publicKey);

        accountsResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, accountsResponse, socketApi)
            : SocketMiddleware.emitToCore(message, socketApi);
    }
}

export default new AccountController();
