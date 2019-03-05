import { Filter } from 'shared/model/types';
import { Reward } from 'shared/model/reward';
import { generateRewards } from 'api/mock/reward';

interface RewardService {
    getRewardByAddress(address: number, filter: Filter): Array<Reward>;
}

export class RewardServiceImpl implements RewardService {

    getRewardByAddress(address: number, filter: Filter): Array<Reward> {
        return generateRewards();
    }
}

export default new RewardServiceImpl();
