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
}
