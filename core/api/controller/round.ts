import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { API } from 'core/api/util/decorators';
import { logger } from 'shared/util/logger';
import RoundRepository from 'core/repository/round';
import RoundRepositoryPG from 'core/repository/round/pg';
import { Round } from 'shared/model/round';

class RoundController {

    constructor() {
        this.getCurrentRound = this.getCurrentRound.bind(this);
        this.getRound = this.getRound.bind(this);
    }

    @API(API_ACTION_TYPES.GET_CURRENT_ROUND)
    public getCurrentRound(message: Message2<{}>): ResponseEntity<Round> {
        logger.debug(`[API][RoundController][GetCurrentController] ${JSON.stringify(message.body)}`);
        return new ResponseEntity({
            data: RoundRepository.getCurrentRound()
        });
    }

    @API(API_ACTION_TYPES.GET_ROUND)
    public async getRound(message: Message2<{ height: number }>): Promise<ResponseEntity<Round>> {
        logger.debug(`[API][Round][getRound] ${JSON.stringify(message.body)}`);
        const data = await RoundRepositoryPG.getByHeight(message.body.height);
        return new ResponseEntity({ data });
    }
}

export default new RoundController();
