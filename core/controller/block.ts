import Response from 'shared/model/response';
import { Block, BlockModel } from 'shared/model/block';
import BlockService from 'core/service/block';
import BlockRepo from 'core/repository/block/';
import BlockPGRepo from 'core/repository/block/pg';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import * as blockUtils from 'core/util/block';
import SyncService from 'core/service/sync';
import SlotService from 'core/service/slot';
import RoundService from 'core/service/round';

interface BlockGenerateRequest {
    keyPair: {
        privateKey: string,
        publicKey: string
    };
    timestamp: number;
}

class BlockController extends BaseController {

    @ON('BLOCK_RECEIVE')
    public async onReceiveBlock(action: { data: { block: BlockModel } }): Promise<Response<void>> {
        const { data } = action;

        const validateResponse = BlockService.isValid(data.block);
        if (!validateResponse.success) {
            return validateResponse;
        }

        const receivedBlock = new Block(data.block);
        const lastBlock = BlockRepo.getLastBlock();

        const errors: Array<string> = [];
        if (blockUtils.isHeightLess(lastBlock, receivedBlock)) {
            return new Response<void>({
                errors: [`[Service][Block][processIncomingBlock] Block has less height: ${receivedBlock.id}`],
            });
        }
        if (blockUtils.isEqualId(lastBlock, receivedBlock)) {
            return new Response<void>({
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
                return new Response<void>({ errors });
            }
            const receiveResponse: Response<void> = await BlockService.receiveBlock(receivedBlock);
            if (!receiveResponse.success) {
                errors.push(...receiveResponse.errors, 'processIncomingBlock');
                return new Response<void>({ errors });
            }
            return new Response<void>({ errors });
        }

        if (blockUtils.isReceivedBlockAbove(lastBlock, receivedBlock)) {
            if (blockUtils.canBeProcessed(lastBlock, receivedBlock)) {
                const receiveResponse: Response<void> = await BlockService.receiveBlock(receivedBlock);
                if (!receiveResponse.success) {
                    errors.push(...receiveResponse.errors, 'processIncomingBlock');
                    return new Response<void>({ errors });
                }
            } else if (!SyncService.consensus) {
                // TODO: undo to common
                // TODO: sync / load blocks
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

        return new Response<void>({ errors });
    }

    @ON('BLOCK_GENERATE')
    public async generateBlock(data: BlockGenerateRequest): Promise<Response<void>> {
        logger.debug(`[Controller][Block][generateBlock]`);
        const response: Response<void> = await BlockService.generateBlock(data.keyPair, data.timestamp);
        if (!response.success) {
            response.errors.push('generateBlock');
        }
        return response;
    }

    @ON('BLOCKCHAIN_READY')
    public async loadLastNBlocks(): Promise<Response<void>> {
        const blocks: Array<string> = await BlockPGRepo.getLastNBlockIds();
        BlockRepo.setLastNBlocks(blocks);
        return new Response<void>();
    }

    @ON('NEW_BLOCKS')
    public updateLastNBlocks(block: Block): Response<void> {
        BlockRepo.appendInLastNBlocks(block);
        return new Response<void>();
    }

    /*
    @RPC('GET_COMMON_BLOCK')
    // called from UI
    private async getCommonBlock(peer: Peer, height: number): Promise<Response<Block>> {
        const idsResponse: Response<{ids: string}> = await BlockService.getIdSequence(height);
        const ids = idsResponse.data.ids;
        const recoveryResponse: Response<Block> = await BlockService.recoverChain();
        if (!recoveryResponse.success) {
            recoveryResponse.errors.push('getCommonBlock');
        }
        return recoveryResponse;
    }
    */
}

export default new BlockController();
