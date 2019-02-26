import ResponseEntity from 'shared/model/response';
import { Account } from 'shared/model/account';
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
    generateHashList(params: {activeDelegates: Array<Account>, blockId: string}):
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
    generateRound(): Promise<ResponseEntity<void>>;

    /**
     * @implements publicKey from config
     * @return your slot for rxBus
     */
    getMyTurn(): number;

    /**
     * calculateReward
     */
    sumRound(round): Promise<ResponseEntity<IRoundSum>>;

    /**
     * Rebuild round if one of blocks apply with delay
     */
    rebuild(): void;

    /**
     * Rollback round if one of blocks fails
     */
    rollBack(): void;

    validate(): boolean;

    apply(param: ResponseEntity<IRoundSum>): Promise<ResponseEntity<void>>;

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

    // TODO: refactor activeDelegates type
    public generateHashList(params: { activeDelegates: Array<Account>, blockId: string }): Array<IHashList> {
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

    public async generateRound(): Promise<ResponseEntity<void>> {
        /**
         * if triggered by ROUND_FINISH event
         */
        if (
            RoundRepository.getCurrentRound()
        ) {
            // TODO: fix it
            // calculate rewards and apply
            // await asyncCompose(
            //     this.apply,
            //     this.sumRound
            // )(RoundRepository.getCurrentRound());

            const sumRoundResponseEntity = await this.sumRound(RoundRepository.getCurrentRound());
            await this.apply(sumRoundResponseEntity);

            // store pound as previous
            RoundRepository.setPrevRound(RoundRepository.getCurrentRound());
        }

        const lastBlock = BlockService.getLastBlock();
        const { data } = DelegateRepository.getActiveDelegates();

        const slots = compose(
            this.generatorPublicKeyToSlot,
            this.sortHashList,
            this.generateHashList
        )
        ({blockId: lastBlock.id, activeDelegates: data});

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

        return new ResponseEntity();
    }

    public getMyTurn(): number {
        return RoundRepository.getCurrentRound().slots[constants.publicKey].slot;
    }

    public async sumRound(round: Round): Promise<ResponseEntity<IRoundSum>> {
        const response = await BlockRepository.loadBlocksOffset(
            {
                offset: 1,
                limit: 100000
            });

        const resp: IRoundSum = {
            roundFees: 0,
            roundDelegates: []
        };

        if (!response.success) {
            return new ResponseEntity({errors: [...response.errors, 'sumRound']});
        } else {
            const blocks = response.data;

            for (let i = 0; i < blocks.length; i++) {
                resp.roundFees += blocks[i].fee;
                resp.roundDelegates.push(blocks[i].generatorPublicKey);
            }

            return new ResponseEntity({errors: [], data: resp});
        }
    }

    public rebuild(): void {
    }

    public rollBack(): void {
    }

    public validate(): boolean {
        return undefined;
    }

    public async apply(param: ResponseEntity<IRoundSum>): Promise<ResponseEntity<void>> {
        if (!await param.success) {
            return new ResponseEntity({errors: [...param.errors, 'applyRound']});
        }

        // increase delegates balance
        // get delegates by publicKeybalance = balance + totalRoundFee/count(delegates)
        // update delegate
        return new ResponseEntity({});
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
