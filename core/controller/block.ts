import { ResponseEntity } from 'shared/model/response';
import { Block, BlockModel } from 'shared/model/block';
import BlockService from 'core/service/block';
import BlockRepo from 'core/repository/block/';
import { MAIN } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import * as blockUtils from 'core/util/block';
import SyncService from 'core/service/sync';
import SlotService from 'core/service/slot';
import { messageON } from 'shared/util/bus';
import SharedTransactionRepo from 'shared/repository/transaction';
import { getLastSlotInRound } from 'core/util/round';
import RoundService from 'core/service/round';
import RoundRepository from 'core/repository/round';
import { ActionTypes } from 'core/util/actionTypes';
import { IKeyPair } from 'shared/util/ed';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import System from 'core/repository/system';

interface BlockGenerateRequest {
    keyPair: IKeyPair;
    timestamp: number;
}

class BlockController extends BaseController {

    @MAIN('BLOCK_RECEIVE')
    public async onReceiveBlock(action: { data: { block: BlockModel } }): Promise<ResponseEntity<void>> {
        const { data } = action;
        data.block.transactions = data.block.transactions.map(trs => SharedTransactionRepo.deserialize(trs));

        const validateResponse = BlockService.validate(data.block);
        if (!validateResponse.success) {
            return validateResponse;
        }

        const receivedBlock = new Block(data.block);
        const lastBlock = BlockRepo.getLastBlock();

        const errors: Array<string> = [];
        if (blockUtils.isLessHeight(lastBlock, receivedBlock)) {
            errors.push(
                `[Controller][Block][onReceiveBlock] Block ${receivedBlock.id} ` +
                `has less height: ${receivedBlock.height}, ` +
                `actual height is ${lastBlock.height}`
            );
            return new ResponseEntity<void>({ errors });
        }
        if (blockUtils.isEqualId(lastBlock, receivedBlock)) {
            errors.push(`[Controller][Block][onReceiveBlock] Block already processed: ${receivedBlock.id}`);
            return new ResponseEntity<void>({ errors });
        }

        logger.debug(
            `[Controller][Block][onReceiveBlock] id: ${data.block.id} ` +
            `height: ${data.block.height} relay: ${data.block.relay}`
        );

        if (
            blockUtils.isReceivedBlockNewer(lastBlock, receivedBlock) &&
            blockUtils.isEqualHeight(lastBlock, receivedBlock) &&
            blockUtils.isEqualPreviousBlock(lastBlock, receivedBlock) &&
            !SyncService.consensus
        ) {

            // TODO check if slot lastBlock and receivedBlock is not equal
            const blockSlot = SlotService.getSlotNumber(receivedBlock.createdAt);
            const lastBlockInPrevRound = RoundRepository.getPrevRound() &&
                getLastSlotInRound(RoundRepository.getPrevRound());

            if (lastBlockInPrevRound >= blockSlot) {
                if (System.synchronization) {
                    let round = RoundRepository.getCurrentRound();
                    const receivedBlockSlotNumber = SlotService.getSlotNumber(receivedBlock.createdAt);
                    while (receivedBlockSlotNumber !== round.slots[receivedBlock.generatorPublicKey].slot) {
                        if (getLastSlotInRound(round) < receivedBlockSlotNumber) {
                            logger.error(
                                `[Controller][Block][onReceiveBlock] Impossible to rollback round ` +
                                `for received block with id: ${receivedBlock.id}, ` +
                                `height: ${receivedBlock.height}`
                            );
                            break;
                        }

                        // backward until we find the right round
                        RoundService.backwardProcess();
                        round = RoundRepository.getCurrentRound();
                    }
                } else {
                    RoundService.backwardProcess();
                }
            }

            const deleteLastBlockResponse = await BlockService.deleteLastBlock();

            if (!deleteLastBlockResponse.success) {
                errors.push(...deleteLastBlockResponse.errors, 'onReceiveBlock');
                return new ResponseEntity<void>({ errors });
            }

            const receiveResponse: ResponseEntity<void> = await BlockService.receiveBlock(receivedBlock);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'onReceiveBlock');
                return new ResponseEntity<void>({ errors });
            }

            if (lastBlockInPrevRound === blockSlot) {
                RoundService.forwardProcess();
            }

            return new ResponseEntity<void>({ errors });
        }

        if (blockUtils.isGreatestHeight(lastBlock, receivedBlock)) {
            if (blockUtils.canBeProcessed(lastBlock, receivedBlock)) {
                // Check this logic. Need for first sync
                const currentRound = RoundRepository.getCurrentRound();
                const receivedBlockSlot = SlotService.getSlotNumber(receivedBlock.createdAt);
                if (!currentRound) {
                    const newRound = RoundService.generate(
                        getFirstSlotNumberInRound(
                            receivedBlock.createdAt,
                            DelegateRepository.getActiveDelegates().length,
                        ),
                    );
                    RoundRepository.add(newRound);
                } else if (
                    receivedBlockSlot > getLastSlotInRound(RoundRepository.getCurrentRound()) &&
                    System.synchronization
                ) {
                    let round = RoundRepository.getCurrentRound();
                    const receivedBlockSlotNumber = SlotService.getSlotNumber(receivedBlock.createdAt);
                    while (receivedBlockSlotNumber !== round.slots[receivedBlock.generatorPublicKey].slot) {
                        if (getLastSlotInRound(round) > receivedBlockSlotNumber) {
                            logger.error(
                                `[Controller][Block][onReceiveBlock] Impossible to build a round ` +
                                `for received block with id: ${receivedBlock.id}, ` +
                                `height: ${receivedBlock.height}`
                            );
                            break;
                        }

                        // forward until we find the right round
                        RoundService.forwardProcess();
                        round = RoundRepository.getCurrentRound();
                    }
                }

                const receiveResponse: ResponseEntity<void> = await BlockService.receiveBlock(receivedBlock);
                if (!receiveResponse.success) {
                    errors.push(...receiveResponse.errors, 'onReceiveBlock');
                    return new ResponseEntity<void>({ errors });
                }

                const lastSlot = getLastSlotInRound(RoundRepository.getCurrentRound());
                if (receivedBlockSlot === lastSlot) {
                    RoundService.forwardProcess();
                }
            } else if (!SyncService.consensus) {
                if (!System.synchronization) {
                    messageON('EMIT_SYNC_BLOCKS');
                }
                errors.push(`[Service][Block][onReceiveBlock] Invalid block`);
            }
        } else {
            errors.push(
                `[Service][Block][onReceiveBlock] ` +
                `Discarded block that does not match with current chain: ${receivedBlock.id}, ` +
                `height: ${receivedBlock.height}, ` +
                `slot: ${SlotService.getSlotNumber(receivedBlock.createdAt)}, ` +
                `generator: ${receivedBlock.generatorPublicKey}`
            );
        }

        return new ResponseEntity<void>({ errors });
    }

    @MAIN(ActionTypes.BLOCK_GENERATE)
    public async generateBlock(data: BlockGenerateRequest): Promise<ResponseEntity<void>> {
        logger.debug(`[Controller][Block][generateBlock]`);
        if (!SyncService.consensus) {
            logger.debug(
                `[Controller][Block][generateBlock]: skip forging block, consensus ${SyncService.getConsensus()}%`
            );
            messageON('EMIT_SYNC_BLOCKS');
            return new ResponseEntity<void>({ errors: ['Invalid consensus'] });
        }
        const response: ResponseEntity<void> = await BlockService.generateBlock(data.keyPair, data.timestamp);
        if (!response.success) {
            response.errors.push('generateBlock');
        }
        return response;
    }
}

export default new BlockController();
