import { Timestamp } from 'shared/model/account';
import { Transaction } from 'shared/model/transaction';
import config from 'shared/config';

export type SortBlock = number | string;

export class BlockModel {
    id?: string | null = null;
    version?: number = config.CONSTANTS.FORGING.CURRENT_BLOCK_VERSION;
    createdAt: Timestamp;
    height?: number | null = null;
    previousBlockId: string | null;
    transactionCount?: number = 0;
    amount?: number = 0;
    fee?: number = 0;
    payloadHash?: string = '';
    generatorPublicKey?: string = '';
    signature?: string = '';
    relay?: number; // Memory only
    transactions: Array<Transaction<object>> = [];

    constructor(data: BlockModel) {
        this.relay = 0;
        Object.assign(this, data);
        this.transactions = (data.transactions || []).map(trs => trs.getCopy());
    }
}

export class Block extends BlockModel {
    public getCopy(): Block {
        return new Block(this);
    }
}
