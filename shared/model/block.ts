import { Transaction } from 'shared/model/transaction';

interface IBlockFields {
    id?: string;
    rowId?: number;
    version?: number;
    timestamp?: number;
    height?: number;
    previousBlock?: string;
    numberOfTransactions?: number;
    totalAmount?: bigint | number;
    totalFee?: bigint | number;
    reward?: number;
    payloadLength?: number;
    payloadHash?: string;
    generatorPublicKey?: string;
    blockSignature?: string;
    generationSignature?: string;
    totalForged?: bigint | number;
    generatorId?: string;
    confirmations?: number;
    username?: string;
    transactions? : Transaction<object>[];
}

export class Block {
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

    // todo: resolve = weak for passing untyped object
    constructor(data: IBlockFields) {
        for (const key in data) {
            if (data[key] || data[key] === 0) {
                if (key === 'totalAmount' || key === 'totalFee' || key === 'totalForged') {
                    this[key] = BigInt(data[key]);
                } else {
                    this[key] = data[key];
                }
            }
        }
    }
}
