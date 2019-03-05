import { getRewardHistoryProps } from 'api/controller/reward/types';
import rewardServiceInstance from 'api/service/reward';

export class RewardController {

    getRewardHistory(data: getRewardHistoryProps) {
        return rewardServiceInstance.getRewardByAddress(data.address, data.filter);
    }
}

export default new RewardController();
