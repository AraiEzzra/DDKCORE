import { Block } from 'shared/model/block';
import { BlockRepo } from 'api/repository/block';
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

export class BlockService {
    private blockRepo = new BlockRepo();
    private lastBlock: Block;
    private sortFields = [
        'id',
        'timestamp',
        'height',
        'previousBlock',
        'totalAmount',
        'totalFee',
        'reward',
        'numberOfTransactions',
        'generatorPublicKey'
    ];

    public loadBlocksData(params: ILoadBlockParams) : Block[] {
        return [];
    }

    public getLastBlock(): Block {
        // load block from db?
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

        // FIXME: Useless condition
        if (filter.numberOfTransactions) {
            where.push('"b_numberOfTransactions" = ${numberOfTransactions}');
            params.numberOfTransactions = filter.numberOfTransactions;
        }

        if (filter.previousBlock) {
            where.push('"b_previousBlock" = ${previousBlock}');
            params.previousBlock = filter.previousBlock;
        }

        if (filter.height === 0 || filter.height > 0) {
            where.push('"b_height" = ${height}');
            params.height = filter.height;
        }

        // FIXME: Useless condition
        if (filter.totalAmount >= 0) {
            where.push('"b_totalAmount" = ${totalAmount}');
            params.totalAmount = filter.totalAmount;
        }

        // FIXME: Useless condition
        if (filter.totalFee >= 0) {
            where.push('"b_totalFee" = ${totalFee}');
            params.totalFee = filter.totalFee;
        }

        // FIXME: Useless condition
        if (filter.reward >= 0) {
            where.push('"b_reward" = ${reward}');
            params.reward = filter.reward;
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

        let rowsCountResponse: number = this.blockRepo.countList(where, params);
        let count: number = rowsCountResponse;
        let rowsListResponse: Block[] = this.blockRepo.list(
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
