import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import AirdropHistoryRepository, {
    AirdropDailyHistoryQuery,
    AirdropHistoryQuery
} from 'core/repository/airdropHistory';

class AirdropHistoryController {

    constructor() {
        this.getHistory = this.getHistory.bind(this);
        this.getDailyHistory = this.getDailyHistory.bind(this);
    }

    @API(API_ACTION_TYPES.GET_AIRDROP_REWARD_HISTORY)
    public getHistory(message: Message<AirdropHistoryQuery>): ResponseEntity<object> {
        const query = {
            ...message.body,
            referralAddress: BigInt(message.body.referralAddress)
        };

        return new ResponseEntity({
            data: AirdropHistoryRepository.getHistory(query)
        });
    }

    @API(API_ACTION_TYPES.GET_AIRDROP_REWARD_DAILY_HISTORY)
    public getDailyHistory(message: Message<AirdropDailyHistoryQuery>): ResponseEntity<object> {

        const query = {
            ...message.body,
            referralAddress: BigInt(message.body.referralAddress)
        };

        return new ResponseEntity({
            data: AirdropHistoryRepository.getDailyHistory(query)
        });
    }

}

export default new AirdropHistoryController();
