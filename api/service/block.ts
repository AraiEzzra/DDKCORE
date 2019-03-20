import { Block, SortBlock } from 'shared/model/block';
import BlockRepository from 'shared/repository/block/memory';
import { ResponseEntity } from 'shared/model/response';

interface IBlockService {
    getMany(limit: number, offset: number, sort?: string): ResponseEntity<Array<Block>>;
    getOne(data: SortBlock): ResponseEntity<Block>;
}

class BlockService implements IBlockService {

    getMany(limit: number, offset: number, sort?: string): ResponseEntity<Array<Block>> {
        const blocks: Array<Block> = BlockRepository.getMany(limit, offset, sort);
        return new ResponseEntity<Array<Block>>({ data: blocks });
    }

    getOne(data: SortBlock): ResponseEntity<Block> {
        const block: Block = BlockRepository.getOne(data);
        return new ResponseEntity<Block>({data: block});
    }
}

export default new BlockService();

