import ResponseEntity from 'shared/model/response';
import { Delegate } from 'shared/model/delegate';
const constants = { // todo config!
    activeDelegates: 11
};

interface IRoundSum {
    roundFees: number;
    roundRewards: number;
    roundDelegates: Array<string>;
}

export interface IRoundService {
    /**
     * for storing relation generator activeDelegate to slot
     */
    round: {[generatorPublicKey: string]: {slot: number}};

    /**
     * Get active delegates
     * @implements {getDelegates(vote, activeDelegates): Array<Delegate>} DelegateRepository
     * @param limit: activeDelegateCount
     */
    getActiveDelegates(limit: number): ResponseEntity<Delegate[]>;

    /**
     * Generate hash (delegate publicKey + previousBlockId)
     * @return hash from DelegatePublicKey + blockId
     */
    generateHashList(activeDelegates: Array<Delegate>, blockId: string):
        Array<{hash: string, generatorPublicKey: string}>;

    sortHashList(hashList: Array<{hash: string, generatorPublicKey: string}>):
        Array<{hash: string, generatorPublicKey: string}>;

    /**
     * Match hash to delegates
     * Create  and store to this.round
     */
    generatorPublicKeyToSlot(sortedHashList: Array<{hash: string, generatorPublicKey: string}>): void;

    /**
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

    validateRound(): boolean;

    applyRound(param: IRoundSum): boolean;

    /**
     * Returns average for each delegate based on height.
     * @return {number} height / delegates
     */
    calc(height: number): number;
}

export class RoundService implements IRoundService {
    round: { [p: string]: { slot: number } };

    public getActiveDelegates(limit: number): ResponseEntity<Delegate[]> {
        return undefined;
    }

    public generateHashList(activeDelegates: Array<Delegate>, blockId: string):
    Array<{ hash: string; generatorPublicKey: string }> {
        return undefined;
    }

    public sortHashList(hashList: Array<{ hash: string; generatorPublicKey: string }>):
    Array<{ hash: string; generatorPublicKey: string }> {
        return undefined;
    }

    public generatorPublicKeyToSlot(sortedHashList: Array<{ hash: string; generatorPublicKey: string }>): void {
    }

    public generateRound(): void {
    }

    public getMyTurn(): number {
        return undefined;
    }

    public sumRound(round): IRoundSum {
        return undefined;
    }

    public rebuildRound(): void {
    }

    public rollBackRound(): void {
    }

    public validateRound(): boolean {
        return undefined;
    }

    public applyRound(param: IRoundSum): boolean {
        return undefined;
    }

    /**
     * Calculates round number from the given height.
     * @param {number} height - Height from which round is calculated
     * @returns {number} Round number
     */
    public calcRound(height: number): number {
        return Math.ceil(height / constants.activeDelegates); // todo round has diff amount of blocks
    }
}


