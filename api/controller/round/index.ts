import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import {Message} from 'shared/model/message';
import { Pagination } from 'api/utils/common';
import { validate } from 'shared/validate';

class RoundController {

    constructor() {
        this.getCurrentRound = this.getCurrentRound.bind(this);
        this.getRounds = this.getRounds.bind(this);
        this.getRound = this.getRound.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_CURRENT_ROUND)
    getCurrentRound(message: Message<{}>, socket: any) {
        SocketMiddleware.emitToCore<{}>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_ROUNDS)
    getRounds(message: Message<Pagination>, socket: any) {
        SocketMiddleware.emitToCore<Pagination>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_ROUND)
    @validate()
    getRound(message: Message<{height: number}>, socket: any) {
        SocketMiddleware.emitToCore<{height: number}>(message, socket);
    }
}

export default new RoundController();
