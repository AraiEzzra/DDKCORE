import { RPC } from 'api/utils/decorators';
import { Message2 } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { Pagination } from 'api/utils/common';
import { validate } from 'shared/validate';

export class DelegateController {

    constructor() {
        this.getDelegates = this.getDelegates.bind(this);
        this.getActiveDelegates = this.getActiveDelegates.bind(this);
        this.getMyDelegates = this.getMyDelegates.bind(this);

    }

    @RPC(API_ACTION_TYPES.GET_DELEGATES)
    @validate()
    getDelegates(message: Message2<Pagination>, socket: any) {
        SocketMiddleware.emitToCore<Pagination>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_ACTIVE_DELEGATES)
    @validate()
    getActiveDelegates(message: Message2<Pagination>, socket: any) {
        SocketMiddleware.emitToCore<Pagination>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_MY_DELEGATES)
    @validate()
    getMyDelegates(message: Message2<Pagination & { address: string }>, socket: any) {
        SocketMiddleware.emitToCore<Pagination & { address: string }>(message, socket);
    }

}

export default new DelegateController();
