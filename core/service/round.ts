import ResponseEntity from 'shared/model/response';
import { Block } from 'shared/model/block';

interface IRoundSum {
    roundFees: number;
    roundRewards: number;
    roundDelegates: Array<string>;
}

export interface IRoundService {

    /**
     * Generate hash list for Active delegates using previous
     * @implements Block
     */
    generateHashList(): Array<string>;

    /**
     * Generate hash using the last block in previous round
     * @param block
     */
    generateHash(block: Block): string;

    /**
     * Generates snapshot round
     * @implements {calc}
     * @param {block} block
     */
    tick(): void;

    /**
     * Performs backward tick on round
     * @implements {calc}
     * @param block
     * @param previousBlock
     */
    backwardTick(block, previousBlock): void;

    /**
     * Gets rows from `round_blocks` and calculates rewards. Loads into scope
     * variable fees, rewards and delegates.
     * @private
     * @param {number} round
     */
    sumRound(round): IRoundSum;

    /**
     * Returns average for each delegate based on height.
     * @param {number} height
     */
    getSlotDelegatesCount(height): number;

    /**
     * Returns average for each delegate based on height.
     * @param {number} height
     * @return {number} height / delegates
     */
    calc(height): number;

    /**
     * Generates outsiders array.
     * Obtains delegate list and for each delegate generate address.
     * @private
     * @implements {delegates.generateDelegateList}
     * @implements {accounts.generateAddressByPublicKey}
     * @param {scope} arg
     */
    getOutsiders(arg: {block: Block, roundDelegates: Array<string>}): ResponseEntity<Array<any>>;

    /**
     * Sets snapshot rounds
     * @param {number} rounds
     */
    setSnapshotRounds(rounds): number;

    /**
     * Deletes from `mem_round` table records based on round.
     * @param {number} round
     */
    flush(round): void;
}
