import AccountService from 'api/service/account';
import { RPC } from 'api/utils/decorators';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { Message, MessageType } from 'shared/model/message';

export class AccountController {

    @RPC('GET_ACCOUNT_BY_ADDRESS')
    getAccountByAddress(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accounts = AccountService.getAccountByAddress(body.address);
        const socketMessage = new Message(MessageType.RESPONSE, code, accounts, headers.id);
        socketApi.emit(MESSAGE_CHANNEL, socketMessage);
    }

    @RPC('GET_ACCOUNT_BY_PUBLIC_KEY')
    getAccountByPublicKey(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accounts = AccountService.getAccountByPublicKey(body.publicKey);
        const socketMessage = new Message(MessageType.RESPONSE, code, accounts, headers.id);
        socketApi.emit(MESSAGE_CHANNEL, socketMessage);
    }
}

export default new AccountController();
