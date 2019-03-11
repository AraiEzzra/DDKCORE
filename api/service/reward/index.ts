import { Filter } from 'shared/model/types';
import { Reward } from 'shared/model/reward';
import ResponseEntity from 'shared/model/response';
import RewardRepository from 'shared/repository/reward';

interface RewardService {
    getRewardByAddress(address: number, filter: Filter): ResponseEntity<Array<Reward>>;

    getReferredUsersReward(address: number, filter: Filter): ResponseEntity<Array<Reward>>;
}

export class RewardServiceImpl implements RewardService {

    getRewardByAddress(address: number, filter: Filter): ResponseEntity<Array<Reward>> {
        const rewards = RewardRepository.getRewardByAddress(address, filter);
        return new ResponseEntity({ data: rewards });
    }

    getReferredUsersReward(address: number, filter: Filter): ResponseEntity<Array<Reward>> {
        const rewards = RewardRepository.getReferredUsersReward(address, filter);
        return new ResponseEntity({ data: rewards });
    }
}

export default new RewardServiceImpl();
