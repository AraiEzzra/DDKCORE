import { Filter } from 'shared/model/types';
import { Reward } from 'shared/model/reward';
import { generateRewards } from 'api/mock/reward';
import ResponseEntity from 'shared/model/response';

interface RewardService {
    getRewardByAddress(address: number, filter: Filter): ResponseEntity<Array<Reward>>;
}

export class RewardServiceImpl implements RewardService {

    getRewardByAddress(address: number, filter: Filter): ResponseEntity<Array<Reward>> {
        return new ResponseEntity<Array<Reward>>({data: generateRewards()});
    }
}

export default new RewardServiceImpl();
