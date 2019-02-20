import { Timestamp } from 'shared/model/account';
import { Transaction } from 'shared/model/transaction';
import config from 'shared/util/config';

export class IBlockFields {
    id?: string | null = null;
    version?: number = config.constants.CURRENT_BLOCK_VERSION;
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
}

export class Block extends IBlockFields {
    // todo: resolve = weak for passing untyped object
    constructor(data: IBlockFields) {
        super();
        Object.assign(this, data);
    }

    public getCopy() {
        return new Block(this);
    }
}
