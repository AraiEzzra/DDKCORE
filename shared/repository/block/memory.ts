import { IBlockRepository, BlockId, DeletedBlockId } from 'shared/repository/block';
import { Block, SortBlock } from 'shared/model/block';

class BlockRepository implements IBlockRepository {

    getMany(limit?: number, offset?: number, sort?: SortBlock): Array<Block> {
        // return generateBlocks();
        return undefined;
    }

    getOne(data: SortBlock): Block {
        // return generateBlocks().find(item => item.id === data || item.height === data);
        return undefined;
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
