import {Block} from 'shared/model/block';
import BlockRepository from 'api/repository/block';
import Response from 'shared/model/response';
import { IBlockRequest } from './interface';
import { IListContainer } from '../../util/common';
import { RPC, SOCKET, VALIDATE, CONTROLLER } from 'api/utils/decorators';

@CONTROLLER('BLOCK')
class BlockController {

    @RPC('GET_BLOCKS_HISTORY')
    @SOCKET('GET_MANY')
    public getBlocksHistory(data?: IBlockRequest) {
        const blocks: Response<IListContainer<Block>> = BlockRepository.getMany();
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

