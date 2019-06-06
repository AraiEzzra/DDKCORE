import { Round } from 'shared/model/round';
import { IRoundRepository as IRoundRepositoryShared } from 'shared/repository/round';

export interface IRoundRepository extends IRoundRepositoryShared {

}

const PREVIOUS_ROUND_OFFSET_FROM_END = 2;

class RoundRepository implements IRoundRepository {
    private rounds: Array<Round> = [];

    public deleteLastRound(): void {
        if (this.rounds.length > 0) {
            this.rounds.length--;
        }
    }

    public add(round: Round): void {
        this.rounds.push(round);
    }

    public getCurrentRound(): Round {
        return this.rounds.length > 0
            ? this.rounds[this.rounds.length - 1]
            : null;
    }

    public getPrevRound(): Round {
        return this.rounds.length > 1
            ? this.rounds[this.rounds.length - PREVIOUS_ROUND_OFFSET_FROM_END]
            : null;
    }
}

export default new RoundRepository();
