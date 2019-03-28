import {Round} from 'shared/model/round';
import {IRoundRepository as IRoundRepositoryShared} from 'shared/repository/round';

export interface IRoundRepository extends IRoundRepositoryShared {

}

class RoundRepository implements IRoundRepository {
    private prevRound: Round;
    private currentRound: Round;

    /**
     * getter for current round
     * @return {Round}
     */
    public getCurrentRound(): Round {
        return this.currentRound;
    }

    /**
     * setter for current round
     * @param {Round} round
     */
    public setCurrentRound(round: Round): void {
        this.currentRound = round;
    }

    /**
     * getter for prevRound round
     * @return {Round}
     */
    public getPrevRound(): Round {
        return this.prevRound;
    }

    /**
     * setter for prevRound round
     * @param {Round} round
     */
    public setPrevRound(round: Round): void {
        this.prevRound = round;
    }

    /**
     * get last slot in round (current round by default)
     * @param {Round} round
     * @return {number}
     */
    public getLastSlotInRound(round: Round = this.currentRound): number {
        return round.slots[Object.keys(round.slots)[Object.keys(round.slots).length - 1]].slot;
    }

    public getFirstSlotInRound(round: Round = this.currentRound): number {
        return round.slots[Object.keys(round.slots)[0]].slot;
    }
}

export default new RoundRepository();
