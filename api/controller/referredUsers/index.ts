import { RPC } from 'api/utils/decorators';
import ReferredUsersService from 'api/service/referredUsers';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';

export class ReferredUsersController {

    constructor() {
        this.getReferredUsers = this.getReferredUsers.bind(this);
        this.getReferredUsersByLevel = this.getReferredUsersByLevel.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_REFERRED_USERS)
    @validate()
    getReferredUsers(message: Message, socket: any) {
        const { body, headers, code } = message;
        const referredUsersResponse = ReferredUsersService.getReferredUsers(body.address, body.filter);

        referredUsersResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, referredUsersResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_REFERRED_USERS_BY_LEVEL)
    @validate()
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
