import { Block } from 'shared/model/block';
import {
    IBlockRepository as IBlockRepositoryShared
} from 'shared/repository/block';
import {messageON} from 'shared/util/bus';

export interface IBlockRepository extends IBlockRepositoryShared {

}

class BlockRepo implements IBlockRepository {
    private memoryBlocks: Array<Block> = [];

    public add(block: Block): Block {
        this.memoryBlocks.push(block);

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
        this.memoryBlocks.pop();
        const lastBlock = this.getLastBlock();
        messageON('LAST_BLOCKS_UPDATE', {
            lastBlock: this.getLastBlock()
        });
        return lastBlock;
    }

    public getMany(startHeight: number, limit?: number): Array<Block> {
        if (!this.memoryBlocks[0]) {
            return [];
        }
        
        const from: number = startHeight - this.memoryBlocks[0].height;
        const to: number = limit ? from + limit : -1;
        return this.memoryBlocks.slice(from, to);
    }

    public isExist(blockId: string): boolean {
        let exists = false;
        for (let i = this.memoryBlocks.length - 1; i >= 0; i--) {
            if (this.memoryBlocks[i].id === blockId) {
                exists = true;
                break;
            }
        }
        return exists;
    }
}

export default new BlockRepo();
