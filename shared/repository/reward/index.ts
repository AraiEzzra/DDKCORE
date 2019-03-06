import { Reward } from 'shared/model/reward';
import { generateRewards } from 'api/mock/reward';
import { Filter } from 'shared/model/types';

export interface RewardRepository {
    getRewardByAddress(address: number, filter: Filter): Array<Reward>;
}

export class RewardRepositoryImpl implements RewardRepository {

    getRewardByAddress(address: number, filter: Filter): Array<Reward> {
        return generateRewards();
    }
}

export default new RewardRepositoryImpl();
