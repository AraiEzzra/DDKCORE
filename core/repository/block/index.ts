import { Block } from 'shared/model/block';
import { IBlockRepository as IBlockRepositoryShared } from 'shared/repository/block';
import { messageON } from 'shared/util/bus';

export interface IBlockRepository extends IBlockRepositoryShared {

}

class BlockRepo implements IBlockRepository {
    private memoryBlocks: Array<Block> = [];
    private readonly memoryBlocksById: { [blockId: string]: Block } = {};

    public add(block: Block): Block {
        this.memoryBlocks.push(block);
        this.memoryBlocksById[block.id] = block;

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
        delete this.memoryBlocksById[block.id];

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

    public isExist(id: string): boolean {
        return this.memoryBlocksById.hasOwnProperty(id);
    }

    public getById(id: string): Block {
        return this.memoryBlocksById[id];
    }
}

export default new BlockRepo();
