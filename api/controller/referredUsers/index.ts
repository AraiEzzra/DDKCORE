import { RPC } from 'api/utils/decorators';
import ResponseEntity from 'shared/model/response';
import { getReferredListByLevelProps, getReferredListProps } from 'api/controller/referredUsers/types';
import ReferredUsersService from 'api/service/referredUsers';
import { AccountModel } from 'shared/model/account';
import AccountService from 'api/service/account';
import { Message, MessageType } from 'shared/model/message';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';

export class ReferredUsersController {

    @RPC('GET_REFERRED_USERS')
    getReferredUsers(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accounts = ReferredUsersService.getReferredUsers(body.address, body.filter);
        const socketMessage = new Message(MessageType.RESPONSE, code, accounts, headers.id);
        socketApi.emit(MESSAGE_CHANNEL, socketMessage);
    }

    @RPC('GET_REFERRED_USERS_BY_LEVEL')
    getReferredUsersByLevel(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accounts = ReferredUsersService.getReferredUsersByLevel(body.address, body.level, body.filter);
        const socketMessage = new Message(MessageType.RESPONSE, code, accounts, headers.id);
        socketApi.emit(MESSAGE_CHANNEL, socketMessage);
    }
}

export default new ReferredUsersController();
