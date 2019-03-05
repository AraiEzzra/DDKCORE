import { Block } from 'shared/model/block';
import config from 'shared/util/config';
import {
    BlockId,
    DeletedBlockId,
    IBlockRepository as IBlockRepositoryShared
} from 'shared/repository/block';
import {messageON} from 'shared/util/bus';

export interface IBlockRepository extends IBlockRepositoryShared {

}

class BlockRepo implements IBlockRepository {
    private memoryBlocks: Array<Block> = [];
    private lastBlock: Block = null;
    private lastNBlockIds: Array<BlockId> = [];

    public add(block: Block): Block {
        this.memoryBlocks.push(block);
        return block;
    }

    public delete(block: Block): DeletedBlockId {
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === block.id) {
                delete (this.memoryBlocks[i]);
                break;
            }
        }
        return block.id;
    }

    public deleteAfterBlock(blockId: string): void {
        let index = null;
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === blockId ) {
                index = i;
                break;
            }
        }
        this.memoryBlocks = this.memoryBlocks.slice(0, index + 1);
        return;
    }


    getById(blockId: BlockId): Block {
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === blockId) {
                return this.memoryBlocks[i].getCopy();
            }
        }
        return;
    }

    public getGenesisBlock(): Block {
        return this.memoryBlocks[0].getCopy();
    }

    public getLastBlock(): Block {
        return this.lastBlock;
    }

    public getLastNBlockIds(): Array<string> {
        return this.lastNBlockIds;
        /*
        const targetBlocks: Array<Block> = this.memoryBlocks.slice(-config.constants.blockSlotWindow);
        const ids: Array<string> = targetBlocks.map((block: Block) => {
            return block.id;
        });
        return ids;
        */
    }

    public getMany(startHeight: number, limit?: number): Array<Block> {
        const from: number = startHeight - this.memoryBlocks[0].height;
        const to: number = limit ? from + limit : -1;
        const targetBlocks: Array<Block> = this.memoryBlocks.slice(from, to);
        return targetBlocks;
    }

    public isExist(blockId: string): boolean {
        let exists = false;
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === blockId) {
                exists = true;
                break;
            }
        }
        return exists;
    }

    public setLastBlock(block: Block): Block {
        this.lastBlock = block;
        return this.lastBlock;
    }

    public setLastNBlocks(blocks: Array<string>): void {
        this.lastNBlockIds = blocks;
    }

    public appendInLastNBlocks(block: Block): void {
        this.lastNBlockIds.push(block.id);
        if (this.lastNBlockIds.length > config.constants.blockSlotWindow) {
            this.lastNBlockIds.shift();
        }
        messageON('LAST_BLOCKS_UPDATE', {
            lastBlock: block
        });
    }
}

export default new BlockRepo();
