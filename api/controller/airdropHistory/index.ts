import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';

import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';
import { AirdropHistoryQuery, AirdropDailyHistoryQuery } from 'shared/repository/airdropHistory/interfaces';

export class AirdropHistoryController {

    constructor() {
        this.getHistory = this.getHistory.bind(this);
        this.getDailyHistory = this.getDailyHistory.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_AIRDROP_REWARD_HISTORY)
    @validate()
    getHistory(message: Message<AirdropHistoryQuery>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_AIRDROP_REWARD_DAILY_HISTORY)
    @validate()
    getDailyHistory(message: Message<AirdropDailyHistoryQuery>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }
}

export default new AirdropHistoryController();
