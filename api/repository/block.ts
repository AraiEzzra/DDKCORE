import { generateBlocks } from '../mock/blocks';
import { IListContainer } from '../util/common';
import Response from 'shared/model/response';
import {Block} from 'shared/model/block';

class TransactionRepository {

    getMany(data?: any): Response<IListContainer<Block>> {
        const blocks = generateBlocks();
        return new Response<IListContainer<Block>>({
            data: {
                data: blocks,
                total_count: blocks.length
            }
        });
    }

    getOne(data: string): Response<Block> {
        const blocks = generateBlocks();
        const block: Block = blocks.find((item) => item.id === data );
        return new Response<Block>({ data: block});
    }
}

export default new TransactionRepository();
