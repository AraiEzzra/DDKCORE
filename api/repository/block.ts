import { mockBlocks } from '../mock/blocks';
import {Block, BlockModel} from 'shared/model/block';
import Response from 'shared/model/response';
import { IListContainer } from '../util/common';

class BlockRepository {

    getMany(data?: any): Response<IListContainer<Block>> {
        /**TODO need to RPC request to CORE*/
        return new Response<IListContainer<BlockModel>>({
            data: mockBlocks,
            total_count: mockBlocks.length
        });
    }

    getOne(data: string | number): Response<BlockModel> {
        /**TODO need to RPC request to CORE*/
        const blocks = mockBlocks.filter((item: Block) => item.id === data || item.height === data);
        return new Response<BlockModel>(blocks[0]);
    }
}

export default new BlockRepository();
