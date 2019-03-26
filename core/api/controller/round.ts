import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { API } from 'core/api/util/decorators';
import { logger } from 'shared/util/logger';
import RoundRepository from 'core/repository/round';
import { Round } from 'shared/model/round';

class RoundController {

    constructor() {
        this.getCurrentRound = this.getCurrentRound.bind(this);
    }

    @API(API_ACTION_TYPES.GET_CURRENT_ROUND)
    public getCurrentRound(message: Message2<{}>): ResponseEntity<Round> {
        logger.debug(`[API][RoundController][GetCurrentController] ${JSON.stringify(message.body)}`);
        return new ResponseEntity({
            data: RoundRepository.getCurrentRound()
        });
    }
}

export default new RoundController();
