import SlotService from 'core/service/slot';
import BlockRepository from 'core/repository/block';
import { Round, Slot } from 'shared/model/round';
import RoundRepository from 'core/repository/round';
import { createTaskON, resetTaskON } from 'shared/util/bus';
import DelegateRepository from 'core/repository/delegate';
import DelegateService from 'core/service/delegate';
import { logger } from 'shared/util/logger';
import { ActionTypes } from 'core/util/actionTypes';
import { getLastSlotNumberInRound } from 'core/util/round';
import { createKeyPairBySecret } from 'shared/util/crypto';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import { IKeyPair } from 'shared/util/ed';
import System from 'core/repository/system';
import { AccountChangeAction } from 'shared/model/account';
import FailService from 'core/service/fail';

const MAX_LATENESS_FORGE_TIME = 500;

interface IRoundService {

    generate(firstSlotNumber: number): Round;

    restore(force: boolean): void;

    forwardProcess(): Round;

    backwardProcess(): Round;

    processReward(round: Round, undo?: Boolean): void;

    restoreToSlot(slotNumber: number): void;
}

class RoundService implements IRoundService {
    private readonly keyPair: IKeyPair;
    private logPrefix: string = '[RoundService]';

    constructor() {
        this.keyPair = createKeyPairBySecret(process.env.FORGE_SECRET);
    }

    restore(force = true): void {
        if (!RoundRepository.getCurrentRound()) {
            const newRound = this.generate(
                getFirstSlotNumberInRound(
                    SlotService.getTruncTime(),
                    DelegateService.getActiveDelegatesCount(),
                ),
            );
            RoundRepository.add(newRound);
        }
        this.createBlockGenerateTask(force);
        this.createRoundFinishTask(force);
    }

    private createBlockGenerateTask(force: boolean): void {
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
                }, force);
            } else {
                logger.info(
                    `${this.logPrefix}[generateRound] Skip forging block to: ${mySlot.slot} after ${cellTime} ms`
                );
            }
        }
    }

    private createRoundFinishTask(force: boolean): void {
        const lastSlot = getLastSlotNumberInRound(RoundRepository.getCurrentRound());
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
        createTaskON(ActionTypes.ROUND_FINISH, roundEndTime, null, force);
    }

    public getMySlot(): Slot {
        return RoundRepository.getCurrentRound().slots[this.keyPair.publicKey.toString('hex')];
    }

    public processReward(round: Round, undo?: Boolean): void {
        const forgedBlocksCount = Object.values(round.slots).filter(slot => slot.isForged).length;
        if (!forgedBlocksCount) {
            return;
        }

        const lastBlock = BlockRepository.getLastBlock();
        const blocks = BlockRepository.getMany(forgedBlocksCount, lastBlock.height - forgedBlocksCount);
        const delegates = blocks.map(block => DelegateRepository.getDelegate(block.generatorPublicKey));
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
        const lastBlockId = FailService.getRightLastRoundBlockId(BlockRepository.getLastBlock().id);
        const delegates = DelegateService.getAllActiveDelegates();
        const slots = SlotService.generateSlots(lastBlockId, delegates, firstSlotNumber);

        const newCurrentRound = new Round({ slots, lastBlockId });
        logger.debug('[Round][Service][generate]', JSON.stringify(newCurrentRound));
        return newCurrentRound;
    }

    public forwardProcess(): Round {
        resetTaskON(ActionTypes.BLOCK_GENERATE);
        resetTaskON(ActionTypes.ROUND_FINISH);

        const currentRound = RoundRepository.getCurrentRound();
        this.processReward(currentRound);

        const newRound = this.generate(getLastSlotNumberInRound(currentRound) + 1);
        RoundRepository.add(newRound);

        if (!System.synchronization) {
            this.createBlockGenerateTask(true);
            this.createRoundFinishTask(true);
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

    public restoreToSlot(slotNumber: number): void {
        let round = RoundRepository.getCurrentRound();
        if (!round) {
            return;
        }

        const isForward = slotNumber > getLastSlotNumberInRound(round);
        const lastBlockSlotNumber = SlotService.getSlotNumber(BlockRepository.getLastBlock().createdAt);

        while (!Object.values(round.slots).find(slot => slot.slot === slotNumber)) {
            if (isForward) {
                if (getLastSlotNumberInRound(round) > slotNumber) {
                    logger.error(
                        `${this.logPrefix}[restoreToSlot] Impossible to forward round ` +
                        `to slot ${slotNumber}`
                    );
                    break;
                }
                this.forwardProcess();
            } else {
                if (getLastSlotNumberInRound(round) < slotNumber) {
                    logger.error(
                        `${this.logPrefix}[restoreToSlot] Impossible to backward round ` +
                        `to slot ${slotNumber}`
                    );
                    break;
                } else if (Object.values(round.slots).find(slot => slot.slot === lastBlockSlotNumber)) {
                    logger.error(
                        `${this.logPrefix}[restoreToSlot] Impossible to backward round ` +
                        `last block is in current round`
                    );
                    break;
                }

                this.backwardProcess();
            }

            round = RoundRepository.getCurrentRound();
        }

        logger.trace(`${this.logPrefix}[restoreToSlot]: restored round ${JSON.stringify(round)}`);
    }
}

export default new RoundService();
