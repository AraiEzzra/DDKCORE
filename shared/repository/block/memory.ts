import { IBlockRepository } from 'shared/repository/block';
import { generateBlocks } from 'api/mock/blocks';
import { Block, SortBlock } from 'shared/model/block';

class BlockRepository implements IBlockRepository {

    getMany(offset: number, limit?: number, sort?: SortBlock): Array<Block> {
        return generateBlocks();
    }

    getOne(data: SortBlock): Block {
        return generateBlocks().find(item => item.id === data || item.height === data);
    }
}

export default new BlockRepository();
