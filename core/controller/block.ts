import Response from 'shared/model/response';
import { Block } from 'shared/model/block';
import { BlockService } from 'core/service/block';
import { BlockRepo } from 'core/repository/block';
import { Peer } from 'shared/model/peer';

export class BlockController {
    private blockService = new BlockService();
    private blockRepo = new BlockRepo();

    @ON('BLOCK_RECEIVE')
    public async onReceiveBlock(block: Block): Promise<Response<void>> {
        const response: Response<void> = await this.blockService.processIncomingBlock(block);
        if (!response.success) {
            response.errors.push('onReceiveBlock');
        }
        return response;
    }

    @ON('BLOCK_GENERATE')
    public async generateBlock( data: { keypair: { privateKey: string, publicKey: string }, timestamp: number }): Promise<Response<void>> {
        const response = await this.blockService.generateBlock(data.keypair, data.timestamp);
        if (!response.success) {
            response.errors.push('generateBlock');
        }
        return response;
    }

    @ON('BLOCKCHIN_READY')
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
        let comparisionFailed = false;

        // Get IDs sequence (comma separated list)
        const ids = this.blockService.getIdSequence(height).ids;

        // Perform request to supplied remote peer
        const result = modules.transport.getFromPeer(peer, {
            api: `/blocks/common?ids=${ids}`,
            method: 'GET'
        });
        const common = result.common;
        // Check that block with ID, previousBlock and height exists in database
        const rows = this.blockRepo.getCommonBlock({
            id: result.body.common.id,
            previousBlock: result.body.common.previousBlock,
            height: result.body.common.height
        });
        if (comparisionFailed && modules.transport.poorConsensus()) {
            return new Response<Block>({ data: await this.blockService.recoverChain() });
        }
    }
}
