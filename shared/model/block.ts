import { Timestamp } from 'shared/model/account';
import { Transaction } from 'shared/model/transaction';

export class Block {
    id: string;
    version: number;
    createdAt: Timestamp;
    height: number;
    previousBlockId: string | null;
    transactionCount: number;
    amount: number;
    fee: number;
    payloadHash: string;
    generatorPublicKey: string;
    signature: string;
    transactions: Array<Transaction<object>>;

}
