import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { API } from 'core/api/util/decorators';
import { logger } from 'shared/util/logger';
import RoundRepository from 'core/repository/round';
import RoundRepositoryPG from 'core/repository/round/pg';
import { Round } from 'shared/model/round';
import { Pagination } from 'api/utils/common';

class RoundController {

    constructor() {
        this.getCurrentRound = this.getCurrentRound.bind(this);
        this.getRounds = this.getRounds.bind(this);
    }

    @API(API_ACTION_TYPES.GET_CURRENT_ROUND)
    public getCurrentRound(message: Message2<{}>): ResponseEntity<Round> {
        logger.debug(`[API][Round][getCurrentRound] ${JSON.stringify(message.body)}`);
        return new ResponseEntity({
            data: RoundRepository.getCurrentRound()
        });
    }

    @API(API_ACTION_TYPES.GET_ROUNDS)
    public async getRounds(message: Message2<Pagination>): Promise<ResponseEntity<Array<Round>>> {
        logger.debug(`[API][Round][getMany] ${JSON.stringify(message.body)}`);
        const data = await RoundRepositoryPG.getMany(message.body.limit, message.body.offset);
        return new ResponseEntity<Array<Round>>({ data });
    }
}

export default new RoundController();
