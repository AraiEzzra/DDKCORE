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
import RoundService from 'core/service/round';
import { messageON } from 'shared/util/bus';
import TransactionRepo from 'core/repository/transaction';

interface BlockGenerateRequest {
    keyPair: {
        privateKey: string,
        publicKey: string
    };
    timestamp: number;
}

class BlockController extends BaseController {

    @MAIN('BLOCK_RECEIVE')
    public async onReceiveBlock(action: { data: { block: BlockModel } }): Promise<ResponseEntity<void>> {
        const { data } = action;
        data.block.transactions = data.block.transactions.map(trs => TransactionRepo.deserialize(trs));

        logger.debug(`[Controller][Block][onReceiveBlock]
         id: ${data.block.id} height: ${data.block.height} relay: ${data.block.relay}`);
        const validateResponse = BlockService.validate(data.block);
        if (!validateResponse.success) {
            return validateResponse;
        }

        const receivedBlock = new Block(data.block);
        const lastBlock = BlockRepo.getLastBlock();

        const errors: Array<string> = [];
        if (blockUtils.isLessHeight(lastBlock, receivedBlock)) {
            return new ResponseEntity<void>({
                errors: [`[Service][Block][processIncomingBlock] Block has less height: ${receivedBlock.id}`],
            });
        }
        if (blockUtils.isEqualId(lastBlock, receivedBlock)) {
            return new ResponseEntity<void>({
                errors: [`[Service][Block][processIncomingBlock] Block already processed: ${receivedBlock.id}`],
            });
        }

        if (
            blockUtils.isEqualHeight(lastBlock, receivedBlock) &&
            blockUtils.isEqualPreviousBlock(lastBlock, receivedBlock) &&
            !SyncService.consensus
        ) {
            const deleteLastBlockResponse = await BlockService.deleteLastBlock();
            if (!deleteLastBlockResponse.success) {
                errors.push(...deleteLastBlockResponse.errors, 'processIncomingBlock');
                return new ResponseEntity<void>({ errors });
            }
            const receiveResponse: ResponseEntity<void> = await BlockService.receiveBlock(receivedBlock);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'processIncomingBlock');
                return new ResponseEntity<void>({ errors });
            }
            return new ResponseEntity<void>({ errors });
        }

        if (blockUtils.isGreatestHeight(lastBlock, receivedBlock)) {
            if (blockUtils.canBeProcessed(lastBlock, receivedBlock)) {
                const receiveResponse: ResponseEntity<void> = await BlockService.receiveBlock(receivedBlock);
                if (!receiveResponse.success) {
                    errors.push(...receiveResponse.errors, 'processIncomingBlock');
                    return new ResponseEntity<void>({ errors });
                }
            } else if (!SyncService.consensus) {
                messageON('EMIT_SYNC_BLOCKS', {});
            }
        } else {
            errors.push(
                `[Service][Block][processIncomingBlock] ` +
                `Discarded block that does not match with current chain: ${receivedBlock.id}, ` +
                `height: ${receivedBlock.height}, ` +
                `round: ${RoundService.calcRound(receivedBlock.height)}, ` +
                `slot: ${SlotService.getSlotNumber(receivedBlock.createdAt)}, ` +
                `generator: ${receivedBlock.generatorPublicKey}`
            );
        }

        return new ResponseEntity<void>({ errors });
    }

    @MAIN('BLOCK_GENERATE')
    public async generateBlock(data: BlockGenerateRequest): Promise<ResponseEntity<void>> {
        logger.debug(`[Controller][Block][generateBlock]`);
        if (!SyncService.consensus) {
            logger.debug(
                `[Controller][Block][generateBlock]: skip forging block, consensus ${SyncService.getConsensus()}%`
            );
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
