import ResponseEntity from 'shared/model/response';
import { Delegate } from 'shared/model/delegate';

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
}

export class RoundService implements IRoundService {
    round: { [p: string]: { slot: number } };

    getActiveDelegates(limit: number): ResponseEntity<Delegate[]> {
        return undefined;
    }

    generateHashList(activeDelegates: Array<Delegate>, blockId: string):
    Array<{ hash: string; generatorPublicKey: string }> {
        return undefined;
    }

    sortHashList(hashList: Array<{ hash: string; generatorPublicKey: string }>):
    Array<{ hash: string; generatorPublicKey: string }> {
        return undefined;
    }

    generatorPublicKeyToSlot(sortedHashList: Array<{ hash: string; generatorPublicKey: string }>): void {
    }

    generateRound(): void {
    }

    getMyTurn(): number {
        return undefined;
    }

    sumRound(round): IRoundSum {
        return undefined;
    }

    rebuildRound(): void {
    }

    rollBackRound(): void {
    }

    validateRound(): boolean {
        return undefined;
    }

    applyRound(param: IRoundSum): boolean {
        return undefined;
    }

}
