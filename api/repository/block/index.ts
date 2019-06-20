import db from 'shared/driver/db';
import query from 'api/repository/block/query';
import { Sort } from 'api/utils/common';
import { BlockModel } from 'shared/model/block';
import { toSnakeCase } from 'shared/util/util';
import SharedBlockPGRepository from 'shared/repository/block/pg';

export type AllowedFilters = {
    height?: number;
};

class BlockPGRepository {

    async getOne(id: string): Promise<BlockModel> {
        const block = await db.oneOrNone(query.getBlock, { id });
        return block && SharedBlockPGRepository.deserialize(block);
    }

    async getMany(
        filter: AllowedFilters,
        sort: Array<Sort>,
        limit: number,
        offset: number,
    ): Promise<{ blocks: Array<BlockModel>, count: number }> {
        const blocks = await db.manyOrNone(
            query.getBlocks(filter, sort.map(elem => `${toSnakeCase(elem[0])} ${elem[1]}`).join(', ')), {
                ...filter,
                limit,
                offset
            });
        if (blocks && blocks.length) {
            return {
                blocks: blocks.map(block => SharedBlockPGRepository.deserialize(block)),
                count: Number(blocks[0].count)
            };
        }
        return {
            blocks: [],
            count: 0
        };

    }

    async getByHeight(height: number): Promise<BlockModel> {
        const block = await db.oneOrNone(query.getBlockByHeight, { height });
        return block && SharedBlockPGRepository.deserialize(block);
    }

    async getLastBlock(): Promise<BlockModel> {
        const block = await db.oneOrNone(query.getLastBlock, {});
        return block && SharedBlockPGRepository.deserialize(block);
    }

}

export default new BlockPGRepository();
