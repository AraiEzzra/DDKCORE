import { Block } from 'shared/model/block';
import { BlockId, IBlockRepository as IBlockRepositoryShared } from 'shared/repository/block';
import { messageON } from 'shared/util/bus';
import { ActionTypes } from 'core/util/actionTypes';

export interface IBlockRepository extends IBlockRepositoryShared {}

class BlockRepo implements IBlockRepository {
    private memoryBlocks: Array<Block> = [];
    private memoryBlocksById: Map<BlockId, Block> = new Map();
    private memoryBlocksByHeight: Map<number, Block> = new Map();
    private genesis: Block;

    public add(block: Block): Block {
        if (block.height === 1) {
            this.genesis = block;
        }

        this.memoryBlocks.push(block);
        this.memoryBlocksById.set(block.id, block);
        this.memoryBlocksByHeight.set(block.height, block);

        messageON(ActionTypes.LAST_BLOCKS_UPDATE, {
            lastBlock: block
        });

        return block;
    }

    public getGenesisBlock(): Block {
        return this.genesis;
    }

    public getLastBlock(): Block {
        return this.memoryBlocks.length
            ? this.memoryBlocks[this.memoryBlocks.length - 1]
            : null;
    }

    public deleteLastBlock(): Block {
        const block = this.memoryBlocks.pop();
        this.memoryBlocksById.delete(block.id);
        this.memoryBlocksByHeight.delete(block.height);

        const lastBlock = this.getLastBlock();

        messageON(ActionTypes.LAST_BLOCKS_UPDATE, {
            lastBlock: this.getLastBlock()
        });
        return lastBlock;
    }

    getMany(limit: number, offset: number = 0): Array<Block> {
        const blocks: Array<Block> = [];
        for (let height = offset + 1; height <= offset + limit; height++) {
            const block = this.memoryBlocksByHeight.get(height);
            if (!block) {
                return blocks;
            }

            blocks.push(block);
        }

        return blocks;
    }

    public has(id: BlockId): boolean {
        return this.memoryBlocksById.has(id);
    }

    public getById(id: BlockId): Block {
        return this.memoryBlocksById[id];
    }

    get size(): number {
        return this.memoryBlocks.length;
    }

    deleteFirst(): Block {
        const block = this.memoryBlocks[0];
        if (!block) {
            return;
        }

        this.memoryBlocks.shift();
        this.memoryBlocksByHeight.delete(block.height);
        this.memoryBlocksById.delete(block.id);

        return block;
    }

    getAll(): Array<Block> {
        return this.memoryBlocks;
    }
}

export default new BlockRepo();
