import { Block } from 'shared/model/block';
import { BlockService } from 'core/service/block';
import { BlockRepo } from 'core/repository/block';
import { Peer } from 'shared/model/peer';

export class BlockController {
    private blockService = new BlockService();
    private blockRepo = new BlockRepo();

    @ON('BLOCK_RECEIVE')
    public onReceiveBlock(block: Block): void {
        this.blockService.processIncomingBlock(block);
    }

    @ON('BLOCK_GENERATE')
    public generateBlock( data: { keypair: { privateKey: string, publicKey: string }, timestamp: number }): void {
        this.blockService.generateBlock(data.keypair, data.timestamp);
    }

    @ON('BLOCKCHIN_READY')
    public loadLastNBlocks(): void {
        const blocks: string[] = this.blockRepo.loadLastNBlocks();
        this.blockService.setLastNBlocks(blocks);
    }

    @ON('NEW_BLOCKS')
    public updateLastNBlocks(block: Block): void {
        this.blockService.updateLastNBlocks(block);
    }

    @RPC('GET_COMMON_BLOCK')
    // called from UI
    /**
     * @implements modules.transport.getFromPeer
     * @implements modules.transport.poorConsensus
     */
    private async getCommonBlock(peer: Peer, height: number): Promise<Block> {
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
            return this.blockService.recoverChain();
        }
    }
}
