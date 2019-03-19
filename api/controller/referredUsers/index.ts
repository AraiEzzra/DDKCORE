import { RPC } from 'api/utils/decorators';
import ReferredUsersService from 'api/service/referredUsers';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { GET_REFERRED_USERS, GET_REFERRED_USERS_BY_LEVEL } from 'shared/driver/socket/codes';

export class ReferredUsersController {

    constructor() {
        this.getReferredUsers = this.getReferredUsers.bind(this);
        this.getReferredUsersByLevel = this.getReferredUsersByLevel.bind(this);
    }

    @RPC(GET_REFERRED_USERS)
    getReferredUsers(message: Message, socket: any) {
        const { body, headers, code } = message;
        const referredUsersResponse = ReferredUsersService.getReferredUsers(body.address, body.filter);

        referredUsersResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, referredUsersResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(GET_REFERRED_USERS_BY_LEVEL)
    getReferredUsersByLevel(message: Message, socket: any) {
        const { body, headers, code } = message;

        const referredUsersResponse =
            ReferredUsersService.getReferredUsersByLevel(body.address, body.level, body.filter);

        referredUsersResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, referredUsersResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }
}

export default new ReferredUsersController();
