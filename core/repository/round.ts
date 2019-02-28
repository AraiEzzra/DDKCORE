import {Round, RoundModel} from 'shared/model/round';

class RoundRepository {
    private prevRound: Round;
    private currentRound: Round;

    /**
     * getter for current round
     * @return {Round}
     */
    getCurrentRound(): Round {
        return this.currentRound;
    }

    /**
     * setter for current round
     * @param {Round} round
     */
    setCurrentRound(round: RoundModel): void {
        this.currentRound = new Round({
            slots: round.slots,
        });
    }

    /**
     * getter for prevRound round
     * @return {Round}
     */
    getPrevRound(): Round {
        return this.prevRound;
    }

    /**
     * setter for prevRound round
     * @param {Round} round
     */
    setPrevRound(round: Round): void {
        this.prevRound = round;
    }

    /**
     * get last slot in round (current round by default)
     * @param {Round} round
     * @return {number}
     */
    getLastSlotInRound(round: Round = this.currentRound): number {
        return round.slots[Object.keys(round.slots)[Object.keys(round.slots).length - 1]].slot;
    }
}

export default new RoundRepository();
