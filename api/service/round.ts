import { getCurrentRound } from 'api/mock/round';
import { Round } from 'shared/model/round';
import ResponseEntity from 'shared/model/response';

class RoundService {

    private round: Round;

    constructor() {
        this.round = getCurrentRound();
    }

    getCurrentRound(): ResponseEntity<Round> {
        return new ResponseEntity<Round>({ data: this.round });
    }
}

export default new RoundService();
