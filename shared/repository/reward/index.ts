import { Reward } from 'shared/model/reward';
import { generateRewards, generateStakeRewards } from 'api/mock/reward';
import { Filter } from 'shared/model/types';
import { Address } from 'shared/model/account';

export interface RewardRepository {
    getRewardByAddress(address: Address, filter: Filter): Array<Reward>;

    getReferredUsersReward(address: Address, filter: Filter): Array<Reward>;
}

export class RewardRepositoryImpl implements RewardRepository {

    getRewardByAddress(address: Address, filter: Filter): Array<Reward> {
        return generateRewards();
    }

    getReferredUsersReward(address: Address, filter: Filter): Array<Reward> {
        return generateStakeRewards();
    }
}

export default new RewardRepositoryImpl();
