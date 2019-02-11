import Response from 'shared/model/response';
import { Block } from 'shared/model/block';
import { BlockService } from 'core/service/block';
import { BlockRepo } from 'core/repository/block';
import { Peer } from 'shared/model/peer';
import { ON, RPC } from "core/util/decorator";
import { BaseController } from 'core/controller/baseController';

interface BlockGenerateRequest {
    keypair: {
        privateKey: string,
        publicKey: string
    };
    timestamp: number;
}

class BlockController extends BaseController {
    private blockService: BlockService = new BlockService();
    private blockRepo: BlockRepo = new BlockRepo();

    @ON('BLOCK_RECEIVE')
    public async onReceiveBlock(block: Block): Promise<Response<void>> {
        const response: Response<void> = await this.blockService.processIncomingBlock(block);
        if (!response.success) {
            response.errors.push('onReceiveBlock');
        }
        return response;
    }

    @ON('BLOCK_GENERATE')
    public async generateBlock( data: BlockGenerateRequest ): Promise<Response<void>> {
        const response: Response<void> = await this.blockService.generateBlock(data.keypair, data.timestamp);
        if (!response.success) {
            response.errors.push('generateBlock');
        }
        return response;
    }

    @ON('BLOCKCHAIN_READY')
    public async loadLastNBlocks(): Promise<Response<void>> {
        const response: Response<string[]> = await this.blockRepo.loadLastNBlocks();
        if (!response.success) {
            return new Response<void>({ errors: [...response.errors, 'loadLastNBlocks'] });
        }
        const blocks: string[] = response.data;
        this.blockService.setLastNBlocks(blocks);
        return new Response<void>();
    }

    @ON('NEW_BLOCKS')
    public updateLastNBlocks(block: Block): Response<void> {
        this.blockService.updateLastNBlocks(block);
        return new Response<void>();
    }

    @RPC('GET_COMMON_BLOCK')
    // called from UI
    /**
     * @implements modules.transport.getFromPeer
     * @implements modules.transport.poorConsensus
     */
    private async getCommonBlock(peer: Peer, height: number): Promise<Response<Block>> {
        const idsResponse: Response<{ids: string}> = await this.blockService.getIdSequence(height);
        const ids = idsResponse.data.ids;
        const recoveryResponse: Response<Block> = await this.blockService.recoverChain();
        if (!recoveryResponse.success) {
            recoveryResponse.errors.push('getCommonBlock');
        }
        return recoveryResponse;
    }
}

export default new BlockController();
