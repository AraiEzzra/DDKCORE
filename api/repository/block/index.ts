import db from 'shared/driver/db';
import query from 'api/repository/block/query';
import { Sort } from 'api/utils/common';
import { BlockModel } from 'shared/model/block';
import { toSnakeCase } from 'shared/util/util';
import SharedBlockPGRepository from 'shared/repository/block/pg';

export type AllowedFilters = {
    height?: number;
}

class BlockPGRepository {

    async getOne(id: string): Promise<BlockModel> {
        return SharedBlockPGRepository.deserialize(await db.oneOrNone(query.getBlock, { id }));
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
        if (blocks) {
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
}

export default new BlockPGRepository();
