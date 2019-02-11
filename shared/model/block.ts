import { Transaction } from 'shared/model/transaction';

class A {
    constructor(data: object) {
        for (const key in data) {
            if (data[key] || data[key] === 0) {
                this[key] = data[key];
            }
        }
    }
}

class BlockFields extends A {
    id?: string;
    rowId?: number;
    version?: number;
    timestamp?: number;
    height?: number;
    previousBlock?: string;
    numberOfTransactions?: number;
    totalAmount?: bigint;
    totalFee?: bigint;
    reward?: number;
    payloadLength?: number;
    payloadHash?: string;
    generatorPublicKey?: string;
    blockSignature?: string;
    generationSignature?: string;
    totalForged?: bigint;
    generatorId?: string;
    confirmations?: number;
    username?: string;
    transactions? : Transaction<object>[];

    constructor(data) {
        super(data);
    }
}

export class Block extends BlockFields {

    // todo: resolve = weak for passing untyped object
    constructor(data: BlockFields) {
        super(data);
    }
}
