import Response from 'shared/model/response';
import crypto from 'crypto';
import SlotService from 'core/service/slot';
import Config from 'shared/util/config';
// todo delete it when find a way to mock services for tests
// import BlockService from 'test/core/mock/blockService';
// import { createTaskON } from 'test/core/mock/bus';
// import BlockRepository from 'test/core/mock/blockRepository';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block';
import { Slots, Round } from 'shared/model/round';
import RoundRepository from 'core/repository/round';
import { createTaskON } from 'shared/util/bus';
import DelegateRepository from 'core/repository/delegate';
import { ed } from 'shared/util/ed';
import { Delegate } from 'shared/model/delegate';
import { logger } from 'shared/util/logger';
import { asyncCompose, compose } from 'core/util/common';

const constants = Config.constants;

interface IHashList {
    hash: string;
    generatorPublicKey: string;
}

interface IRoundSum {
    roundFees: number;
    roundDelegates: Array<string>;
}

interface IRoundService {

    /**
     * Generate hash (delegate publicKey + previousBlockId)
     * @return hash from DelegatePublicKey + blockId
     */
    generateHashList(params: {activeDelegates: Array<Delegate>, blockId: string}):
        Array<{hash: string, generatorPublicKey: string}>;

    sortHashList(hashList: Array<{hash: string, generatorPublicKey: string}>):
        Array<{hash: string, generatorPublicKey: string}>;

    /**
     * Match hash to delegates
     * Create  and store to this.round
     */
    generatorPublicKeyToSlot(sortedHashList: Array<{hash: string, generatorPublicKey: string}>): Slots;

    /**
     * triggered by onRoundFinish or onApplyLastBlockInRound
     * @implements getLastBlock from blocks repository
     */
    generateRound(): Response<void>;

    /**
     * @implements publicKey from config
     * @return your slot for rxBus
     */
    getMyTurn(): number;

    /**
     * calculateReward
     */
    sumRound(round): Promise<Response<IRoundSum>>;

    /**
     * Rebuild round if one of blocks apply with delay
     */
    rebuild(): void;

    /**
     * Rollback round if one of blocks fails
     */
    rollBack(): void;

    validate(): boolean;

    apply(param: Promise<Response<IRoundSum>>): Promise<Response<void>>;

    undo(param: IRoundSum): boolean;

    /**
     * Calculates round number from the given height.
     * @param {number} height - Height from which round is calculated
     * @returns {number} Round number
     */
    calcRound(height: number): number;

}

class RoundService implements IRoundService {
    private keypair: {
        privateKey: string,
        publicKey: string,
    };

    constructor() {
        const hash = crypto.createHash('sha256').update(process.env.FORGE_SECRET, 'utf8').digest();
        const keypair = ed.makeKeypair(hash);

        this.keypair = {
            privateKey: keypair.privateKey.toString('hex'),
            publicKey: keypair.publicKey.toString('hex'),
        };
    }

    public generateHashList(params: { activeDelegates: Array<Delegate>, blockId: string }): Array<IHashList> {
        return params.activeDelegates.map((delegate: Delegate) => {
            const publicKey = delegate.account.publicKey;
            const hash = crypto.createHash('md5').update(publicKey + params.blockId).digest('hex');
            return {
                hash,
                generatorPublicKey: publicKey
            };
        });
    }

    public sortHashList(hashList: Array<IHashList>): Array<IHashList> {
        return hashList.sort((a, b) => {
            if (a.hash > b.hash) {
                return 1;
            }
            if (a.hash < b.hash) {
                return -1;
            }
            return 0;
        });
    }

    public generatorPublicKeyToSlot(sortedHashList: Array<IHashList>): Slots {
        let firstSlot = SlotService.getSlotNumber();
        // set the last round slot

        return sortedHashList.reduce(
            (acc: Object = {}, item: IHashList, i) => {
            acc[item.generatorPublicKey] = { slot: firstSlot + i };
            return acc;
        }, {});
    }

    public generateRound(): Response<void> {
        /**
         * if triggered by ROUND_FINISH event
         */
        if (
            RoundRepository.getCurrentRound()
        ) {

            compose(
                this.apply,
                this.sumRound
            )(RoundRepository.getCurrentRound());

            // store pound as previous
            RoundRepository.setPrevRound(RoundRepository.getCurrentRound());
        }

        const lastBlock = BlockService.getLastBlock();
        const delegateResponse = DelegateRepository.getActiveDelegates();

        if (!delegateResponse.success) {
            logger.error('[RoundService][generateRound] Can\'t get Active delegates');
            return new Response({errors: [...delegateResponse, '[generateRound] Can\'t get Active delegates']});
        }

        const slots = compose(
            this.generatorPublicKeyToSlot,
            this.sortHashList,
            this.generateHashList
        )
        ({blockId: lastBlock.id, activeDelegates: delegateResponse.data});

        RoundRepository.setCurrentRound({slots, startHeight: lastBlock.height + 1});
        logger.info(`[Service][Round][generateRound] Start round id: ${RoundRepository.getCurrentRound().id}`);

        const mySlot = this.getMyTurn();

        if (mySlot) {
            // start forging block at mySlotTime
            const cellTime = SlotService.getSlotTime(mySlot - SlotService.getSlotNumber());
            logger.info(`[Service][Round][generateRound] Start forging block to: ${mySlot} after ${cellTime} seconds`);
            createTaskON('BLOCK_GENERATE', cellTime, {
                timestamp: SlotService.getSlotTime(mySlot),
                keypair: this.keypair,
            });
        }

        // create event for end of current round
        const lastSlot = RoundRepository.getLastSlotInRound();

        // lastSlot + 1 for waiting finish last round
        const RoundEndTime = SlotService.getSlotTime(lastSlot + 1 - SlotService.getSlotNumber());

        createTaskON('ROUND_FINISH', RoundEndTime);

        return new Response();
    }

    public getMyTurn(): number {
        return RoundRepository.getCurrentRound().slots[constants.publicKey].slot;
    }

    public async sumRound(round: Round): Promise<Response<IRoundSum>> {
        const blockResponse = await BlockRepository.loadBlocksOffset(
            {
                offset: 1,
                limit: 100000
            });

        const resp: IRoundSum = {
            roundFees: 0,
            roundDelegates: []
        };
        
        if (!blockResponse.success) {
            return new Response({errors: [...blockResponse.errors, 'sumRound']});
        } else {
            const blocks = blockResponse.data;

            for (let i = 0; i < blocks.length; i++) {
                resp.roundFees += blocks[i].fee;
                resp.roundDelegates.push(blocks[i].generatorPublicKey);
            }

            return new Response({errors: [], data: resp});
        }
    }

    public rebuild(): void {
    }

    public rollBack(): void {
    }

    public validate(): boolean {
        return undefined;
    }

    public async apply(param: Promise<Response<IRoundSum>>): Promise<Response<void>> {
        const response = await param;

        if (response.success) {
            return new Response({errors: [...response.errors, 'applyRound']});
        }

        // increase delegates balance
        // get delegates by publicKeybalance = balance + totalRoundFee/count(delegates)
        // update delegate
        return new Response({});
    }

    public undo(param: IRoundSum): boolean {
        // if (!param.roundDelegates.length) {
        //     return false;
        // }

        // increase delegates balance
        // get delegates by publicKey
        // balance = balance + totalRoundFee/count(delegates)
        // update delegate
        return undefined;
    }

    public calcRound(height: number): number {
        return Math.ceil(height / constants.activeDelegates); // todo round has diff amount of blocks
    }
}

export default new RoundService();
