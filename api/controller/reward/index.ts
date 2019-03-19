import RewardService from 'api/service/reward';
import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { GET_REFERRED_USERS_REWARD, GET_REWARD_HISTORY } from 'shared/driver/socket/codes';

export class RewardController {

    constructor() {
        this.getRewardHistory = this.getRewardHistory.bind(this);
        this.getReferredUsersReward = this.getReferredUsersReward.bind(this);
    }

    @RPC(GET_REWARD_HISTORY)
    getRewardHistory(message: Message, socket: any) {
        const { body, headers, code } = message;
        const rewardResponse = RewardService.getRewardByAddress(body.address, body.filter);

        rewardResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, rewardResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(GET_REFERRED_USERS_REWARD)
    getReferredUsersReward(message: Message, socket: any) {
        const { body, headers, code } = message;
        const rewardResponse = RewardService.getReferredUsersReward(body.address, body.filter);

        rewardResponse.success
            ? SocketMiddleware.emitToClient(headers.id, code, rewardResponse, socket)
            : SocketMiddleware.emitToCore(message, socket);
    }
}

export default new RewardController();
