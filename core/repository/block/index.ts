import { Block } from 'shared/model/block';
import { BlockId, IBlockRepository as IBlockRepositoryShared } from 'shared/repository/block';
import { messageON } from 'shared/util/bus';

export interface IBlockRepository extends IBlockRepositoryShared {

}

class BlockRepo implements IBlockRepository {
    private memoryBlocks: Array<Block> = [];
    private memoryBlocksById: Map<BlockId, Block> = new Map();

    public add(block: Block): Block {
        this.memoryBlocks.push(block);
        this.memoryBlocksById.set(block.id, block);

        messageON('LAST_BLOCKS_UPDATE', {
            lastBlock: block
        });

        return block;
    }

    public getGenesisBlock(): Block {
        return this.memoryBlocks[0];
    }

    public getLastBlock(): Block {
        return this.memoryBlocks.length ? this.memoryBlocks[this.memoryBlocks.length - 1] : null;
    }

    public deleteLastBlock(): Block {
        const block = this.memoryBlocks.pop();
        this.memoryBlocksById.delete(block.id);

        const lastBlock = this.getLastBlock();

        messageON('LAST_BLOCKS_UPDATE', {
            lastBlock: this.getLastBlock()
        });
        return lastBlock;
    }

    public getMany(limit: number, offset?: number): Array<Block> {
        if (!this.memoryBlocks[0]) {
            return [];
        }
        if (offset && offset < this.memoryBlocks[0].height) {
            return [];
        }
        const from: number = offset || 0;
        return this.memoryBlocks.slice(from, from + limit);
    }

    public isExist(id: BlockId): boolean {
        return this.memoryBlocksById.has(id);
    }

    public getById(id: BlockId): Block {
        return this.memoryBlocksById[id];
    }
}

export default new BlockRepo();
