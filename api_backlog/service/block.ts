import { Block } from 'shared/model/block';
import BlockRepo from 'api/repository/block';
import Response from 'shared/model/response';
const OrderBy = require('../../helpers/orderBy.js');

interface ILoadBlockParams {
    limit: number;
    lastId: string;
}

interface IListParams {
    generatorPublicKey?: string;
    numberOfTransactions?: number;
    previousBlock?: string;
    height?: number;
    totalAmount?: number;
    totalFee?: number;
    reward?: number;
    limit?: number;
    offset?: number;
    orderBy?: string;
}

class BlockService {
    private lastBlock: Block;
    private sortFields = [
        'id',
        'timestamp',
        'height'
    ];

    public loadBlocksData(params: ILoadBlockParams) : Block[] {
        return [];
    }

    public getLastBlock(): Block {
        return this.lastBlock;
    }

    /**
     * @deprecated
     */
    public setLastBlock(block: Block): Block {
        this.lastBlock = block;
        return this.lastBlock;
    }

    public dbRead(raw: {[key: string]: any}, radix: number = 10): Block { return undefined; }

    public calculateFee(): number { return undefined; }

    public list(filter: IListParams): Response<{ blocks: Block[], count: number }> {
        const params: IListParams = {};
        const where: string[] = [];

        if (filter.generatorPublicKey) {
            where.push('"b_generatorPublicKey"::bytea = ${generatorPublicKey}');
            params.generatorPublicKey = filter.generatorPublicKey;
        }

        if (filter.previousBlock) {
            where.push('"b_previousBlock" = ${previousBlock}');
            params.previousBlock = filter.previousBlock;
        }

        if (filter.height > 0) {
            where.push('"b_height" = ${height}');
            params.height = filter.height;
        }

        if (!filter.limit) {
            params.limit = 100;
        } else {
            params.limit = Math.abs(filter.limit);
        }

        if (!filter.offset) {
            params.offset = 0;
        } else {
            params.offset = Math.abs(filter.offset);
        }

        if (params.limit > 100) {
            return new Response({ errors: ['Invalid limit. Maximum is 100']});
        }

        const orderBy = OrderBy(
            (filter.orderBy || 'height:desc'), {
                sortFields: this.sortFields,
                fieldPrefix: 'b_'
            }
        );

        if (orderBy.error) {
            return new Response({ errors: [orderBy.error]});
        }

        let rowsCountResponse: number = BlockRepo.countList(where, params);
        let count: number = rowsCountResponse;
        let rowsListResponse: Block[] = BlockRepo.list(
            {
                where,
                sortField: orderBy.sortField,
                sortMethod: orderBy.sortMethod
            },
            params);
        let blocks: Block[] = rowsListResponse;
        return new Response({ data: { blocks, count }});
    }
}

export default new BlockService();
