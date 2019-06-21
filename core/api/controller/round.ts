import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { API } from 'core/api/util/decorators';
import RoundRepository from 'core/repository/round';
import { Round } from 'shared/model/round';
import { Pagination } from 'shared/util/common';
import RoundService from 'core/service/round';
import { ActiveDelegate } from 'ddk.registry/src/model/common/delegate';

class RoundController {

    constructor() {
        this.getCurrentRound = this.getCurrentRound.bind(this);
        this.getCurrentRoundDelegates = this.getCurrentRoundDelegates.bind(this);
        this.getRounds = this.getRounds.bind(this);
        this.getRound = this.getRound.bind(this);
    }

    @API(API_ACTION_TYPES.GET_CURRENT_ROUND)
    public getCurrentRound(): ResponseEntity<Round> {
        return new ResponseEntity({
            data: RoundRepository.getCurrentRound()
        });
    }

    @API(API_ACTION_TYPES.GET_CURRENT_ROUND_DELEGATES)
    public getCurrentRoundDelegates(): ResponseEntity<Array<ActiveDelegate>> {
        return new ResponseEntity({
            data: RoundService.getDelegates(RoundRepository.getCurrentRound()),
        });
    }

    @API(API_ACTION_TYPES.GET_ROUNDS)
    public async getRounds(message: Message<Pagination>): Promise<ResponseEntity<Array<Round>>> {
        const data = await RoundRepository.getMany(message.body.limit, message.body.offset);
        return new ResponseEntity<Array<Round>>({ data });
    }

    @API(API_ACTION_TYPES.GET_ROUND)
    public async getRound(message: Message<{ index: number }>): Promise<ResponseEntity<Round>> {
        const data = await RoundRepository.getByIndex(message.body.index);
        return new ResponseEntity({ data });
    }
}

export default new RoundController();
