import { Reward } from 'shared/model/reward';
import { generateRewards, generateStakeRewards } from 'api/mock/reward';
import { Filter } from 'shared/model/types';

export interface RewardRepository {
    getRewardByAddress(address: string, filter: Filter): Array<Reward>;

    getReferredUsersReward(address: string, filter: Filter): Array<Reward>;
}

export class RewardRepositoryImpl implements RewardRepository {

    getRewardByAddress(address: string, filter: Filter): Array<Reward> {
        return generateRewards();
    }

    getReferredUsersReward(address: string, filter: Filter): Array<Reward> {
        return generateStakeRewards();
    }
}

export default new RewardRepositoryImpl();
