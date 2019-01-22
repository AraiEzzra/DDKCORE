import { transaction } from '../enums';

export interface ITransactionModel <T extends object> {
    id: string;
    blockId: string;
    type: number;
    senderPublicKey: string;
    senderId: string;
    recipientId: string;
    signature: string;
    trsName: transaction.TransactionType;
    rowId?: number;
    amount?: bigint;
    timestamp?: number;
    stakedAmount?: bigint;
    stakeId?: string;
    groupBonus?: bigint;
    pendingGroupBonus?: bigint;
    fee?: bigint;
    signSignature?: string;
    requesterPublicKey?: string;
    signatures?: string;
    reward?: string;
    assetTypes?: T;
}
