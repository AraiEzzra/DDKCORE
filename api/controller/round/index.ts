import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import {Message2} from 'shared/model/message';
import { Pagination } from 'api/utils/common';
import { validate } from 'shared/validate';

class RoundController {

    constructor() {
        this.getCurrentRound = this.getCurrentRound.bind(this);
        this.getRounds = this.getRounds.bind(this);
    }


    @RPC(API_ACTION_TYPES.GET_CURRENT_ROUND)
    getCurrentRound(message: Message2<{}>, socket: any) {
        SocketMiddleware.emitToCore<{}>(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_ROUNDS)
    getRounds(message: Message2<Pagination>, socket: any) {
        SocketMiddleware.emitToCore<Pagination>(message, socket);
    }
}

export default new RoundController();
