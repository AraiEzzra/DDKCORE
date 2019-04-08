import { Round } from 'shared/model/round';
import { IRoundRepository as IRoundRepositoryShared } from 'shared/repository/round';

export interface IRoundRepository extends IRoundRepositoryShared {

}

class RoundRepository implements IRoundRepository {
    private rounds: Array<Round> = [];
    
    deleteLastRound(): void {
        if (this.rounds.length > 0) {
            this.rounds.length--;
        }
    }

    add(round: Round): void {
        this.rounds.push(round);
    }


    public getCurrentRound(): Round {
        return this.rounds.length > 0 ? this.rounds[this.rounds.length - 1] : null;
    }

    public getPrevRound(): Round {
        return this.rounds.length > 1 ? this.rounds[this.rounds.length - 2] : null;
    }
}

export default new RoundRepository();
