import { getRewardHistoryProps } from 'api/controller/reward/types';
import RewardService from 'api/service/reward';
import { RPC } from 'api/utils/decorators';
import ResponseEntity from 'shared/model/response';
import { Reward } from 'shared/model/reward';
import ReferredUsersService from 'api/service/referredUsers';
import { Message, MessageType } from 'shared/model/message';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';

export class RewardController {

    @RPC('GET_REWARD_HISTORY')
    getRewardHistory(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accounts = RewardService.getRewardByAddress(body.address, body.filter);
        const socketMessage = new Message(MessageType.RESPONSE, code, accounts, headers.id);
        socketApi.emit(MESSAGE_CHANNEL, socketMessage);
    }

    @RPC('GET_REFERRED_USERS_REWARD')
    getReferredUsersReward(message: Message, socketApi: any) {
        const { body, headers, code } = message;
        const accounts = RewardService.getReferredUsersReward(body.address, body.filter);
        const socketMessage = new Message(MessageType.RESPONSE, code, accounts, headers.id);
        socketApi.emit(MESSAGE_CHANNEL, socketMessage);
    }
}

export default new RewardController();
