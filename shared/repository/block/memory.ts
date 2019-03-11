import { IBlockRepository, BlockId, DeletedBlockId } from 'shared/repository/block';
import { generateBlocks } from 'api/mock/blocks';
import { Block, SortBlock } from 'shared/model/block';

class BlockRepository implements IBlockRepository {

    getMany(offset: number, limit?: number, sort?: SortBlock): Array<Block> {
        return generateBlocks();
    }

    getOne(data: SortBlock): Block {
        return generateBlocks().find(item => item.id === data || item.height === data);
    }

    add(block: Block): Block {
        return undefined;
    }

    delete(block: Block): DeletedBlockId {
        return undefined;
    }

    deleteAfterBlock(blockId: BlockId): void {
    }

    getById(blockId: BlockId): Block {
        return undefined;
    }

    getGenesisBlock(): Block {
        return undefined;
    }

    getLastBlock(): Block {
        return undefined;
    }

    getLastNBlockIds(): Array<BlockId> {
        return undefined;
    }

    isExist(blockId: BlockId): boolean {
        return false;
    }

    setLastBlock(block: Block): void {
    }

}

export default new BlockRepository();
