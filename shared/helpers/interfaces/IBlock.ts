
export interface IBlockModel {
    id: string;
    rowId: number;
    version: number;
    timestamp: number;
    height: number;
    previousBlock: string;
    numberOfTransactions: number;
    totalAmount: bigint;
    reward: bigint;
    payloadLength?: number;
    payloadHash?: number;
    generatorPublicKey?: string;
    blockSignature: string;
}