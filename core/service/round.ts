import SlotService from 'core/service/slot';
import BlockRepository from 'core/repository/block';
import { Round, Slot } from 'shared/model/round';
import RoundRepository from 'core/repository/round';
import { createTaskON, resetTaskON } from 'shared/util/bus';
import DelegateRepository from 'core/repository/delegate';
import { logger } from 'shared/util/logger';
import { ActionTypes } from 'core/util/actionTypes';
import { getLastSlotInRound } from 'core/util/round';
import { createKeyPairBySecret } from 'shared/util/crypto';
import { getFirstSlotNumberInRound } from 'core/util/slot';

const MAX_LATENESS_FORGE_TIME = 500;

interface IRoundService {

    generate(firstSlot: Slot): Round;

    restore(): void;

    forwardProcess(): void;

    backwardProcess(): void;
}

class RoundService implements IRoundService {
    private readonly keyPair: {
        privateKey: string;
        publicKey: string;
    };
    private logPrefix: string = '[RoundService]';
    private isBlockChainReady: boolean = false;

    constructor() {
        const keyPair = createKeyPairBySecret(process.env.FORGE_SECRET);

        this.keyPair = {
            privateKey: keyPair.privateKey.toString('hex'),
            publicKey: keyPair.publicKey.toString('hex'),
        };
    }

    // TODO useless
    setIsBlockChainReady(status: boolean) {
        this.isBlockChainReady = status;
    }

    // TODO useless
    getIsBlockChainReady(): boolean {
        return this.isBlockChainReady;
    }

    restore(): void {
        if (!RoundRepository.getCurrentRound()) {
            const newRound = this.generate(
                getFirstSlotNumberInRound(SlotService.getTruncTime(), DelegateRepository.getActiveDelegates().length)
            );
            RoundRepository.add(newRound);
        }
        this.createBlockGenerateTask();
        this.startRoundFinishTask();
    }

    private createBlockGenerateTask(): void {
        const mySlot = this.getMySlot();
        if (mySlot) {
            let cellTime = SlotService.getSlotRealTime(mySlot) - new Date().getTime();
            if (cellTime < 0 && cellTime + MAX_LATENESS_FORGE_TIME >= 0) {
                cellTime = 0;
            }
            if (cellTime >= 0) {
                logger.info(
                    `${this.logPrefix}[generateRound] Start forging block to: ${mySlot} after ${cellTime} ms`
                );
                createTaskON(ActionTypes.BLOCK_GENERATE, cellTime, {
                    timestamp: SlotService.getSlotTime(mySlot),
                    keyPair: this.keyPair,
                });
            } else {
                logger.info(
                    `${this.logPrefix}[generateRound] Skip forging block to: ${mySlot} after ${cellTime} ms`
                );
            }
        }
    }

    private startRoundFinishTask(): void {
        const lastSlot = getLastSlotInRound(RoundRepository.getCurrentRound());
        const roundEndTime = SlotService.getSlotRealTime(lastSlot + 1) - new Date().getTime();

        if (roundEndTime < 0) {
            logger.info(
                `${this.logPrefix}[startRoundFinishTask] Skip finish round`
            );
            return;
        }

        logger.debug(
            `${this.logPrefix}[startRoundFinishTask] The round will be completed in ${roundEndTime} ms`
        );
        createTaskON(ActionTypes.ROUND_FINISH, roundEndTime);
    }

    public getMySlot(): number {
        return RoundRepository.getCurrentRound().slots[this.keyPair.publicKey];
    }

    private processReward(round: Round, undo?: Boolean): void {
        const forgedBlocksCount = Object.keys(round.slots).length;
        const lastBlock = BlockRepository.getLastBlock();
        const blocks = BlockRepository.getMany(forgedBlocksCount, lastBlock.height - forgedBlocksCount);
        const delegates = blocks
            .map(block => DelegateRepository.getDelegate(block.generatorPublicKey))
            .filter(delegate => Boolean(delegate));
        logger.debug('[Round][Service][processReward][delegate]', delegates);
        const fee = Math.ceil(blocks.reduce((sum, block) => sum += block.fee, 0) / delegates.length);

        delegates.forEach(delegate => {
            delegate.account.actualBalance += (undo ? -fee : fee);
        });
    }

    public generate(firstSlot: Slot): Round {
        const lastBlock = BlockRepository.getLastBlock();
        const delegates = DelegateRepository.getActiveDelegates();
        const slots = SlotService.generate(lastBlock.id, delegates, firstSlot);

        const newCurrentRound = new Round({
            slots: slots
        });
        logger.debug('[Round][Service][newGenerateRound]', newCurrentRound);
        return newCurrentRound;
    }

    public forwardProcess(): void {
        const currentRound = RoundRepository.getCurrentRound();
        this.processReward(currentRound);

        const newRound = this.generate(getLastSlotInRound(currentRound) + 1);
        RoundRepository.add(newRound);
        this.createBlockGenerateTask();
        this.startRoundFinishTask();
    }

    public backwardProcess(): void {
        resetTaskON(ActionTypes.BLOCK_GENERATE);
        resetTaskON(ActionTypes.ROUND_FINISH);
        if (RoundRepository.getPrevRound()) {
            RoundRepository.deleteLastRound();
            this.processReward(RoundRepository.getCurrentRound(), true);
        }
    }
}

export default new RoundService();
