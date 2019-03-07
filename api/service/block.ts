import { Block, SortBlock } from 'shared/model/block';
import BlockRepository from 'shared/repository/block/memory';
import {reqGetBlocks } from 'api/controller/block/types';
import ResponseEntity from 'shared/model/response';

interface IBlockService {
    getMany(data?: reqGetBlocks): ResponseEntity<Array<Block>>;
    getOne(data: SortBlock): ResponseEntity<Block>;
}

class BlockService implements IBlockService {

    getMany(data?: reqGetBlocks): ResponseEntity<Array<Block>> {
        const blocks: Array<Block> = BlockRepository.getMany(data.offset, data.limit, data.sort);
        return new ResponseEntity<Array<Block>>({ data: blocks });
    }

    getOne(data: SortBlock): ResponseEntity<Block> {
        const block: Block = BlockRepository.getOne(data);
        return new ResponseEntity<Block>({data: block});
    }
}

export default new BlockService();

