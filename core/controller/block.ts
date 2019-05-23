import { ResponseEntity } from 'shared/model/response';
import { Block, BlockModel } from 'shared/model/block';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block/';
import { MAIN } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import * as blockUtils from 'core/util/block';
import { isEqualHeight } from 'core/util/block';
import SyncService from 'core/service/sync';
import SlotService from 'core/service/slot';
import { messageON } from 'shared/util/bus';
import SharedTransactionRepo from 'shared/repository/transaction';
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
    public async onReceiveBlock({ data }: { data: { block: BlockModel } }): Promise<ResponseEntity<void>> {

        const validateResponse = BlockService.validate(data.block);
        if (!validateResponse.success) {
            return new ResponseEntity<void>({
                errors: [
                    `[Controller][Block][onNewReceiveBlock] Block not valid: ${validateResponse.errors}`
                ]
            });
        }

        const receivedBlock = new Block(data.block);
        let lastBlock = BlockRepository.getLastBlock();

        const validateReceivedBlocKResponse = BlockService.validateReceivedBlock(lastBlock, receivedBlock);
        if (!validateReceivedBlocKResponse.success) {
            return new ResponseEntity<void>({
                errors: [
                    `[Controller][Block][onNewReceiveBlock] Received block not valid: 
                    ${validateReceivedBlocKResponse.errors}`
                ]
            });
        }

        if (isEqualHeight(lastBlock, receivedBlock)) {
            await BlockService.deleteLastBlock();
            lastBlock = BlockRepository.getLastBlock();
            RoundService.restoreToSlot(SlotService.getSlotNumber(lastBlock.createdAt));
        }

        RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));
        const receiveBlockResponse = await BlockService.receiveBlock(lastBlock);

        const currentSlotNumber = SlotService.getSlotNumber(SlotService.getTime(Date.now()));
        RoundService.restoreToSlot(currentSlotNumber);

        if (!receiveBlockResponse.success) {
            if (!SyncService.getMyConsensus()) {
                if (!System.synchronization) {// TODO remove it if
                    messageON('EMIT_SYNC_BLOCKS');
                }
            }
            return new ResponseEntity<void>({
                errors: [
                    `[Controller][Block][receiveBlockResponse] block: ${receivedBlock.id} 
                    errors: ${validateResponse.errors}`
                ]
            });
        }

        return new ResponseEntity<void>();
    }

    public async onOldReceiveBlock(action: { data: { block: BlockModel } }): Promise<ResponseEntity<void>> {
        const { data } = action;
        data.block.transactions = data.block.transactions.map(trs => SharedTransactionRepo.deserialize(trs));

        const validateResponse = BlockService.validate(data.block);
        if (!validateResponse.success) {
            return validateResponse;
        }

        const receivedBlock = new Block(data.block);
        const lastBlock = BlockRepository.getLastBlock();

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
            blockUtils.isNewer(lastBlock, receivedBlock) &&
            blockUtils.isEqualHeight(lastBlock, receivedBlock) &&
            blockUtils.isEqualPreviousBlock(lastBlock, receivedBlock) &&
            !SyncService.getMyConsensus()
        ) {
            // TODO check if slot lastBlock and receivedBlock is not equal

            RoundService.restoreToSlot(SlotService.getSlotNumber(lastBlock.createdAt));
            const deleteLastBlockResponse = await BlockService.deleteLastBlock();
            if (!deleteLastBlockResponse.success) {
                errors.push(...deleteLastBlockResponse.errors, 'onReceiveBlock');
                return new ResponseEntity<void>({ errors });
            }

            RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));
            const receiveResponse: ResponseEntity<void> = await BlockService.receiveBlock(receivedBlock);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'onReceiveBlock');
                return new ResponseEntity<void>({ errors });
            }

            return new ResponseEntity<void>({ errors });
        }

        if (blockUtils.isGreatestHeight(lastBlock, receivedBlock)) {
            if (blockUtils.isBlockCanBeProcessed(lastBlock, receivedBlock)) {
                // Check this logic. Need for first sync
                const currentRound = RoundRepository.getCurrentRound();
                const receivedBlockSlotNumber = SlotService.getSlotNumber(receivedBlock.createdAt);
                if (!currentRound) {
                    const newRound = RoundService.generate(
                        getFirstSlotNumberInRound(
                            receivedBlock.createdAt,
                            DelegateRepository.getActiveDelegates().length,
                        ),
                    );
                    RoundRepository.add(newRound);
                }

                RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));
                const receiveResponse: ResponseEntity<void> = await BlockService.receiveBlock(receivedBlock);
                if (!receiveResponse.success) {
                    errors.push(...receiveResponse.errors, 'onReceiveBlock');
                    return new ResponseEntity<void>({ errors });
                }
            } else if (!SyncService.getMyConsensus()) {
                if (!System.synchronization) {
                    messageON('EMIT_SYNC_BLOCKS');
                }
                errors.push(`[Controller][Block][onReceiveBlock] Invalid block`);
            }
        } else {
            errors.push(
                `[Controller][Block][onReceiveBlock] ` +
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
        if (!SyncService.getMyConsensus()) {
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
