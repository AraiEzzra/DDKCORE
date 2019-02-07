import ResponseEntity from 'shared/model/response';
import { Delegate } from 'shared/model/delegate';

interface IRoundSum {
    roundFees: number;
    roundRewards: number;
    roundDelegates: Array<string>;
}

interface Round {
    generatorPublicKey: string;
    slot: number;
}

export interface IRoundService {
    /**
     * for storing relation generator activeDelegate to slot
     */
    roundHashList: Array<Round>;

    /**
     * Get active delegates
     * @implements {getDelegates(vote, activeDelegates): Array} DelegateRepository
     * @param limit: activeDelegateCount
     */
    getActiveDelegates(limit: number): ResponseEntity<Delegate[]>;

    /**
     * Generate hash (delegate publicKey + idPreviousBlock)
     * @return hash from DelegatePublicKey + blockId
     */
    generateHash(publicKey: string, blockId: string): string;

    /**
     * Sort hash function
     */
    sortHashList(hashList: Array<string>): Array<string>;

    /**
     * Match hash to delegates
     * triggered by onRoundFinish or onApplyLastBlockInRound
     * @implements getLastBlock from blocks repository
     */
    generateRound(): void;

    /**
     * @implements publicKey from config
     * @return your slot for rxBus
     */
    getMyTurn(): number;

    /**
     * calculateReward
     */
    sumRound(round): IRoundSum;

    /**
     * Rebuild round if one of blocks apply with delay
     */
    rebuildRound(): void;

    /**
     * Rollback round if one of blocks fails
     */
    rollBackRound(): void;

    /**
     * validateRound
     */
    validateRound(): boolean;

    /**
     * apply round
     */
    applyRound(param: IRoundSum): boolean;

}
