import { Transaction } from 'shared/model/transaction';

export class Block {
    id: string;
    rowId: number;
    version: number;
    timestamp: number;
    height: number;
    previousBlock: string;
    numberOfTransactions: number;
    totalAmount: number;
    totalFee: number;
    reward: number;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;
    blockSignature: string;
    generationSignature?: string;
    totalForged?: number;
    generatorId?: string;
    confirmations: number;
    username: string;
    transactions? : Transaction<object>[];
}
