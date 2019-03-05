import { Timestamp } from 'shared/model/account';
import { Transaction } from 'shared/model/transaction';
// import config from 'shared/util/config';

export class BlockModel {
    id?: string | null = null;
    version?: number = 1;
    createdAt: Timestamp;
    height?: number | null = null;
    previousBlockId: string | null;
    transactionCount?: number = 0;
    amount?: number = 0;
    fee?: number = 0;
    payloadHash?: string = '';
    generatorPublicKey?: string = '';
    signature?: string = '';
    transactions?: Array<Transaction<object>> | null = null;

    constructor(data: BlockModel) {
        Object.assign(this, data);
    }
}

export class Block extends BlockModel {
    public getCopy(): Block {
        return new Block(this);
    }
}
