import { ResponseEntity } from 'shared/model/response';
import { Block, BlockModel } from 'shared/model/block';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block/';
import { MAIN } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import { isEqualHeight } from 'core/util/block';
import SyncService from 'core/service/sync';
import SlotService from 'core/service/slot';
import { messageON } from 'shared/util/bus';
import RoundService from 'core/service/round';
import { ActionTypes } from 'core/util/actionTypes';
import { IKeyPair } from 'shared/util/ed';
import SharedTransactionRepo from 'shared/repository/transaction';

interface BlockGenerateRequest {
    keyPair: IKeyPair;
    timestamp: number;
}

class BlockController extends BaseController {

   @MAIN(ActionTypes.BLOCK_RECEIVE)
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
        receivedBlock.transactions = receivedBlock.transactions.map(
            trs => SharedTransactionRepo.deserialize(trs)
        );
        let lastBlock = BlockRepository.getLastBlock();

        const validateReceivedBlocKResponse = BlockService.validateReceivedBlock(lastBlock, receivedBlock);
        if (!validateReceivedBlocKResponse.success) {
            return new ResponseEntity<void>({
                errors: [
                    '[Controller][Block][onNewReceiveBlock] Received block not valid: ' +
                    `${validateReceivedBlocKResponse.errors}`
                ]
            });
        }

        if (isEqualHeight(lastBlock, receivedBlock)) {
            RoundService.restoreToSlot(SlotService.getSlotNumber(lastBlock.createdAt));
            await BlockService.deleteLastBlock();
        }

        RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));
        const receiveBlockResponse = await BlockService.receiveBlock(receivedBlock);

        const currentSlotNumber = SlotService.getSlotNumber(SlotService.getTime(Date.now()));
        RoundService.restoreToSlot(currentSlotNumber);

        RoundService.restore(false);

        if (!receiveBlockResponse.success) {
            if (!SyncService.getMyConsensus()) {
                messageON(ActionTypes.EMIT_SYNC_BLOCKS);
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

    @MAIN(ActionTypes.BLOCK_GENERATE)
    public async generateBlock(data: BlockGenerateRequest): Promise<ResponseEntity<void>> {
        logger.trace(`[Controller][Block][generateBlock]`);
        if (!SyncService.getMyConsensus()) {
            logger.debug(
                `[Controller][Block][generateBlock]: skip forging block, consensus ${SyncService.getConsensus()}%`
            );
            messageON(ActionTypes.EMIT_SYNC_BLOCKS);
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
