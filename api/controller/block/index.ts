import {Block, SortBlock} from 'shared/model/block';
import BlockService from 'api/service/block';
import ResponseEntity from 'shared/model/response';
import { reqGetBlocks } from 'api/controller/block/types';
import { RPC } from 'api/utils/decorators';

class BlockController {

    @RPC('GET_BLOCKS_HISTORY')
    public getBlocksHistory(data?: reqGetBlocks) {
        const blocks: ResponseEntity<Array<Block>> = BlockService.getMany(data);
        return blocks;
    }

    @RPC('GET_BLOCK')
    public getBlockHistory(data: SortBlock) {
        const block: ResponseEntity<Block> = BlockService.getOne(data);
        return block;
    }
}

export default new BlockController();

