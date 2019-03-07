import RoundService from 'api/service/round';
import { RPC } from 'api/utils/decorators';
import ResponseEntity from 'shared/model/response';
import { Round } from 'shared/model/round';

class RoundController {

    @RPC('GET_CURRENT_ROUND')
    getCurrentRound(): ResponseEntity<Round> {
        return RoundService.getCurrentRound();
    }
}

export default new RoundController();
