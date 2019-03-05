import { getRewardHistoryProps } from 'api/controller/reward/types';
import rewardServiceInstance from 'api/service/reward';
import { RPC } from 'api/utils/decorators';

export class RewardController {

    @RPC('GET_REWARD_HISTORY')
    getRewardHistory(data: getRewardHistoryProps) {
        return rewardServiceInstance.getRewardByAddress(data.address, data.filter);
    }
}

export default new RewardController();
