import { getRewardHistoryProps } from 'api/controller/reward/types';
import RewardService from 'api/service/reward';
import { RPC } from 'api/utils/decorators';
import ResponseEntity from 'shared/model/response';
import { Reward } from 'shared/model/reward';

export class RewardController {

    @RPC('GET_REWARD_HISTORY')
    getRewardHistory(data: getRewardHistoryProps): ResponseEntity<Array<Reward>> {
        return RewardService.getRewardByAddress(data.address, data.filter);
    }
}

export default new RewardController();
