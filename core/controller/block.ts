import Response from 'shared/model/response';
import { Block, BlockModel } from 'shared/model/block';
import BlockService from 'core/service/block';
import BlockRepo from 'core/repository/block';
import { Peer } from 'shared/model/peer';
import { ON, RPC } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';

interface BlockGenerateRequest {
    keypair: {
        privateKey: string,
        publicKey: string
    };
    timestamp: number;
}

class BlockController extends BaseController {

    @ON('BLOCK_RECEIVE')
    public async onReceiveBlock(action: { data: { block: BlockModel } }): Promise<Response<void>> {
        const { data } = action;
        const block = new Block(data.block);

        logger.debug(`[Controller][Block][onReceiveBlock] block id ${block.id}`);
        const response: Response<void> = await BlockService.processIncomingBlock(block);
        if (!response.success) {
            response.errors.push('onReceiveBlock');
        }
        return response;
    }

    @ON('BLOCK_GENERATE')
    public async generateBlock(data: BlockGenerateRequest): Promise<Response<void>> {
        logger.debug(`[Controller][Block][generateBlock]`);
        const response: Response<void> = await BlockService.generateBlock(data.keypair, data.timestamp);
        if (!response.success) {
            response.errors.push('generateBlock');
        }
        return response;
    }

    @ON('BLOCKCHAIN_READY')
    public async loadLastNBlocks(): Promise<Response<void>> {
        const response: Response<Array<string>> = await BlockRepo.loadLastNBlocks();
        if (!response.success) {
            return new Response<void>({ errors: [...response.errors, 'loadLastNBlocks'] });
        }
        const blocks: Array<string> = response.data;
        BlockService.setLastNBlocks(blocks);
        return new Response<void>();
    }

    @ON('NEW_BLOCKS')
    public updateLastNBlocks(block: Block): Response<void> {
        BlockService.updateLastNBlocks(block);
        return new Response<void>();
    }

    @RPC('GET_COMMON_BLOCK')
    // called from UI
    /**
     * @implements modules.transport.getFromPeer
     * @implements modules.transport.poorConsensus
     */
    private async getCommonBlock(peer: Peer, height: number): Promise<Response<Block>> {
        const idsResponse: Response<{ids: string}> = await BlockService.getIdSequence(height);
        const ids = idsResponse.data.ids;
        const recoveryResponse: Response<Block> = await BlockService.recoverChain();
        if (!recoveryResponse.success) {
            recoveryResponse.errors.push('getCommonBlock');
        }
        return recoveryResponse;
    }
}

export default new BlockController();
