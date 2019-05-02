import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';

export class ReferredUsersController {

    constructor() {
        this.getReferredUsers = this.getReferredUsers.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_REFERRED_USERS)
    @validate()
    getReferredUsers(message: Message, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }
}

export default new ReferredUsersController();
