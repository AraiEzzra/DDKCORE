import { generateBlocks } from '../mock/blocks';
import { resGetBlocks } from 'api/controller/block/types';
import Response from 'shared/model/response';
import {Block} from 'shared/model/block';

class TransactionRepository {

    getMany(data?: any): Response<resGetBlocks> {
        const blocks = generateBlocks();
        return new Response<resGetBlocks>({
            data: {
                blocks,
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
