export enum TransactionType {
    REGISTER = 0,
    SEND = 10,
    SIGNATURE = 20,
    DELEGATE = 30,
    STAKE = 40,
    SENDSTAKE = 50,
    VOTE = 60,
    MULTI = 70,
    DAPP = 80,
    IN_TRANSFER = 90,
    OUT_TRANSFER = 100,
}

export enum TransactionStatus {
    CREATED,
    QUEUED,
    PROCESSED,
    QUEUED_AS_CONFLICTED,
    VERIFIED,
    UNCONFIRM_APPLIED,
    PUT_IN_POOL,
    BROADCASTED,
    APPLIED,
    DECLINED
}

export interface IModelTransaction <T extends object> {
    id: string;
    blockId: string;
    type: number;
    senderPublicKey: string;
    senderId: string;
    recipientId: string;
    signature: string;
    trsName: TransactionType;
    rowId?: number; // useless
    amount?: bigint;
    timestamp?: number;
    stakedAmount?: bigint; // useless ?
    stakeId?: string; // useless
    groupBonus?: bigint; // useless
    pendingGroupBonus?: bigint; // useless
    fee?: bigint;
    signSignature?: string;
    requesterPublicKey?: string; // useless
    signatures?: string; // useless
    reward?: string; // useless
    status?: TransactionStatus;
    assetTypes?: T;
}

export class Transaction <T extends object> implements IModelTransaction <any> {
    id: string;
    blockId: string;
    type: number;
    senderPublicKey: string;
    senderId: string;
    recipientId: string;
    signature: string;
    trsName: TransactionType;
    amount?: bigint;
    timestamp?: number;
    stakedAmount?: bigint; // useless ?
    fee?: bigint;
    signSignature?: string;
    status?: TransactionStatus;
    assetTypes?: T;
}
