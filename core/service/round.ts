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
import { IKeyPair } from 'shared/util/ed';
import System from 'core/repository/system';
import { AccountChangeAction } from 'shared/model/account';

const MAX_LATENESS_FORGE_TIME = 500;

interface IRoundService {

    generate(firstSlotNumber: number): Round;

    restore(): void;

    forwardProcess(): Round;

    backwardProcess(): Round;

    processReward(round: Round, undo?: Boolean): void;

    rollbackToLastBlock(): Round;
}

class RoundService implements IRoundService {
    private readonly keyPair: IKeyPair;
    private logPrefix: string = '[RoundService]';

    constructor() {
        this.keyPair = createKeyPairBySecret(process.env.FORGE_SECRET);
    }

    restore(): void {
        if (!RoundRepository.getCurrentRound()) {
            const newRound = this.generate(
                getFirstSlotNumberInRound(
                    SlotService.getTruncTime(),
                    DelegateRepository.getActiveDelegates().length
                ),
            );
            RoundRepository.add(newRound);
        }
        this.createBlockGenerateTask();
        this.createRoundFinishTask();
    }

    private createBlockGenerateTask(): void {
        const mySlot = this.getMySlot();
        if (mySlot) {
            let cellTime = SlotService.getSlotRealTime(mySlot.slot) - new Date().getTime();
            if (cellTime < 0 && cellTime + MAX_LATENESS_FORGE_TIME >= 0) {
                cellTime = 0;
            }
            if (cellTime >= 0) {
                logger.info(
                    `${this.logPrefix}[generateRound] Start forging block to: ${mySlot.slot} after ${cellTime} ms`
                );
                createTaskON(ActionTypes.BLOCK_GENERATE, cellTime, {
                    timestamp: SlotService.getSlotTime(mySlot.slot),
                    keyPair: this.keyPair,
                });
            } else {
                logger.info(
                    `${this.logPrefix}[generateRound] Skip forging block to: ${mySlot.slot} after ${cellTime} ms`
                );
            }
        }
    }

    private createRoundFinishTask(): void {
        const lastSlot = getLastSlotInRound(RoundRepository.getCurrentRound());
        let roundEndTime = SlotService.getSlotRealTime(lastSlot + 1) - new Date().getTime();

        if (roundEndTime < 0) {
            logger.info(
                `${this.logPrefix}[startRoundFinishTask] Skip finish round`
            );
            roundEndTime = 0;
        }

        logger.debug(
            `${this.logPrefix}[startRoundFinishTask] The round will be completed in ${roundEndTime} ms`
        );
        createTaskON(ActionTypes.ROUND_FINISH, roundEndTime);
    }

    public getMySlot(): Slot {
        return RoundRepository.getCurrentRound().slots[this.keyPair.publicKey.toString('hex')];
    }

    public processReward(round: Round, undo?: Boolean): void {
        const forgedBlocksCount = Object.values(round.slots).filter(slot => slot.isForged).length;
        const lastBlock = BlockRepository.getLastBlock();
        const blocks = BlockRepository.getMany(forgedBlocksCount, lastBlock.height - forgedBlocksCount);
        const delegates = blocks.map(block => DelegateRepository.getDelegate(block.generatorPublicKey));
        logger.debug('[Round][Service][processReward][delegate]', delegates);
        const fee = Math.ceil(blocks.reduce((sum, block) => sum += block.fee, 0) / delegates.length);

        delegates.forEach(delegate => {
            delegate.account.actualBalance += (undo ? -fee : fee);
            delegate.account.addHistory(undo
                ? AccountChangeAction.DISTRIBUTE_FEE_UNDO :
                AccountChangeAction.DISTRIBUTE_FEE, null
            );
        });
    }

    public generate(firstSlotNumber: number): Round {
        const lastBlock = BlockRepository.getLastBlock();
        const delegates = DelegateRepository.getActiveDelegates();
        const slots = SlotService.generateSlots(lastBlock.id, delegates, firstSlotNumber);

        const newCurrentRound = new Round({
            slots: slots
        });
        logger.debug('[Round][Service][generate]', JSON.stringify(newCurrentRound));
        return newCurrentRound;
    }

    public forwardProcess(): Round {
        resetTaskON(ActionTypes.BLOCK_GENERATE);
        resetTaskON(ActionTypes.ROUND_FINISH);

        const currentRound = RoundRepository.getCurrentRound();
        this.processReward(currentRound);

        const newRound = this.generate(getLastSlotInRound(currentRound) + 1);
        RoundRepository.add(newRound);

        if (!System.synchronization) {
            this.createBlockGenerateTask();
            this.createRoundFinishTask();
        }
        return newRound;
    }

    public backwardProcess(): Round {
        resetTaskON(ActionTypes.BLOCK_GENERATE);
        resetTaskON(ActionTypes.ROUND_FINISH);
        if (RoundRepository.getPrevRound()) {
            RoundRepository.deleteLastRound();
            this.processReward(RoundRepository.getCurrentRound(), true);
        }
        return RoundRepository.getCurrentRound();
    }

    public rollbackToLastBlock = (): Round => {
        let round = RoundRepository.getCurrentRound();
        if (!round) {
            return null;
        }

        const lastBlock = BlockRepository.getLastBlock();
        const lastBlockSlot = SlotService.getSlotNumber(lastBlock.createdAt);

        while (round.slots[lastBlock.generatorPublicKey].slot !== lastBlockSlot) {
            if (getLastSlotInRound(round) < lastBlockSlot) {
                logger.error(
                    `${this.logPrefix}[rollbackToLastBlock] Impossible to rollback round ` +
                    `to block with id: ${lastBlock.id}, ` +
                    `height: ${lastBlock.height}`
                );
                break;
            }
            logger.debug(
                `${this.logPrefix}[rollbackToLastBlock] round rollback ${JSON.stringify(round)}`
            );
            round = this.backwardProcess();
        }

        logger.info(`${this.logPrefix}[rollbackToLastBlock]: restored round ${JSON.stringify(round)}`);

        return round;
    }
}

export default new RoundService();
