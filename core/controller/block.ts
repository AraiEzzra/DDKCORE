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
import TransactionQueue from 'core/service/transactionQueue';
import { PeerAddress } from 'shared/model/types';
import { BlockSchema } from 'ddk.registry/dist/model/common/block';

interface BlockGenerateRequest {
    keyPair: IKeyPair;
    timestamp: number;
}

type BlockReceiveSchema = {
    data: BlockSchema,
    peerAddress: PeerAddress
};

class BlockController extends BaseController {

    @MAIN(ActionTypes.BLOCK_RECEIVE)
    public async onReceiveBlock(message: BlockReceiveSchema): Promise<ResponseEntity<void>> {

        const receivedBlock = new Block(message.data);
        const validateResponse = BlockService.validate(receivedBlock);

        if (!validateResponse.success) {
            return new ResponseEntity<void>({
                errors: [
                    `[Controller][Block][onReceiveBlock] Block not valid: ${validateResponse.errors}`
                ]
            });
        }

        let lastBlock = BlockRepository.getLastBlock();

        const validateReceivedBlockResponse = BlockService.validateReceivedBlock(lastBlock, receivedBlock);
        if (!validateReceivedBlockResponse.success) {
            return new ResponseEntity<void>({
                errors: [
                    '[Controller][Block][onReceiveBlock] Received block not valid: ' +
                    `${validateReceivedBlockResponse.errors}`
                ],
            });
        }

        if (isEqualHeight(lastBlock, receivedBlock)) {
            RoundService.restoreToSlot(SlotService.getSlotNumber(lastBlock.createdAt));
            await BlockService.deleteLastBlock();
        }

        RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));

        TransactionQueue.lock();
        const receiveBlockResponse = await BlockService.receiveBlock(receivedBlock);
        TransactionQueue.unlock();

        if (!receiveBlockResponse.success) {
            if (!SyncService.getMyConsensus()) {
                messageON(ActionTypes.EMIT_SYNC_BLOCKS);
            }
            return new ResponseEntity<void>({
                errors: [
                    `[Controller][Block][receiveBlockResponse] block: ${receivedBlock.id} ` +
                    `errors: ${validateResponse.errors}`
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

        TransactionQueue.lock();
        const response: ResponseEntity<void> = await BlockService.generateBlock(data.keyPair, data.timestamp);
        TransactionQueue.unlock();

        if (!response.success) {
            response.errors.push('generateBlock');
        }
        return response;
    }
}

export default new BlockController();
