import { Block } from 'shared/model/block';
import { BlockService } from 'core/service/block';
import { BlockRepo } from 'core/repository/block';

export class BlockController {
    private blockService = new BlockService();
    private blockRepo = new BlockRepo();

    @ON('BLOCK_RECEIVE')
    public onReceiveBlock(block: Block): void {
        let lastBlock = this.blockService.getLastBlock();

        if (block.previousBlock === lastBlock.id && lastBlock.height + 1 === block.height) {
            return this.blockService.receiveBlock(block);
        } else if (block.previousBlock !== lastBlock.id && lastBlock.height + 1 === block.height) {
            return this.blockService.receiveForkOne(block, lastBlock);
        } else if (
            block.previousBlock === lastBlock.previousBlock &&
            block.height === lastBlock.height && block.id !== lastBlock.id
        ) {
            return this.blockService.receiveForkFive(block, lastBlock);
        }
    }

    @ON('BLOCKCHIN_READY')
    public loadLastNBlocks(): void {
        const blocks: string[] = this.blockRepo.loadLastNBlocks();
        this.blockService.setLastNBlocks(blocks);
    }

    @ON('NEW_BLOCK')
    public updateLastNBlocks(block: Block): void {
        this.blockService.updateLastNBlocks(block);
    }
}
