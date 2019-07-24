import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { Pagination, Sort } from 'shared/util/common';
import { validate } from 'shared/validate';
import { RequestDelegates, RequestActiveDelegates } from 'shared/model/types';

export class DelegateController {

    constructor() {
        this.getDelegates = this.getDelegates.bind(this);
        this.getActiveDelegates = this.getActiveDelegates.bind(this);
        this.getMyDelegates = this.getMyDelegates.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_DELEGATES)
    @validate()
    getDelegates(message: Message<Pagination & { sort: Array<Sort>, username: string }>, socket: any) {
        if (!message.body.sort) {
            message.body.sort = [['approval', 'DESC'], ['publicKey', 'ASC']];
        } else if (!message.body.sort.length) {
            message.body.sort.push(['approval', 'DESC'], ['publicKey', 'ASC']);
        }

        const coreMessage = new Message<RequestDelegates>(message.headers.type, message.code, {
            filter: {
                limit: message.body.limit,
                offset: message.body.offset,
                username: message.body.username,
            },
            sort: message.body.sort,
        }, message.headers.id);

        SocketMiddleware.emitToCore<RequestDelegates>(coreMessage, socket);
    }

    @RPC(API_ACTION_TYPES.GET_ACTIVE_DELEGATES)
    @validate()
    getActiveDelegates(message: Message<Pagination & { sort: Array<Sort> }>, socket: any) {
        const coreMessage = new Message<RequestActiveDelegates>(message.headers.type, message.code, {
            filter: {
                limit: message.body.limit,
                offset: message.body.offset,
            },
            sort: message.body.sort,
        }, message.headers.id);

        SocketMiddleware.emitToCore<RequestActiveDelegates>(coreMessage, socket);
    }

    @RPC(API_ACTION_TYPES.GET_MY_DELEGATES)
    @validate()
    getMyDelegates(message: Message<Pagination & { address: string, sort: Array<Sort> }>, socket: any) {
        SocketMiddleware.emitToCore<Pagination & { address: string, sort: Array<Sort> }>(message, socket);
    }

}

export default new DelegateController();
