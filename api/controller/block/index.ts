import {Block} from 'shared/model/block';
import BlockRepository from 'api/repository/block';
import Response from 'shared/model/response';
import { reqGetBlocks, resGetBlocks } from 'api/controller/block/types';
import { RPC, VALIDATE } from 'api/utils/decorators';

class BlockController {

    @RPC('GET_BLOCKS_HISTORY')
    public getBlocksHistory(data?: reqGetBlocks) {
        const blocks: Response<resGetBlocks> = BlockRepository.getMany();
        return blocks.data;
    }

    @RPC('GET_BLOCK_HISTORY')
    @VALIDATE('getBlock')
    public getBlockHistory(data) {
        const block: Response<Block> = BlockRepository.getOne(data);
        return block.data;
    }
}

export default new BlockController();

