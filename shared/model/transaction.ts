import { Address, PublicKey, Timestamp } from 'shared/model/account';

export enum TransactionType {
    REGISTER = 0,
    SEND = 10,
    SIGNATURE = 20,
    DELEGATE = 30,
    STAKE = 40,
    SENDSTAKE = 50,
    VOTE = 60,
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
export interface IModelAsset {

}

export interface IAirdropAsset {
    withAirdropReward: boolean;
    sponsors: Array<string>;
    totalReward: number;
}

export interface IAsset {

}

export interface IAssetRegister extends IAsset {
    referral: string;
}

export interface IAssetTransfer extends IAsset {
    recipientAddress: Address;
}

export interface IAssetSignature extends IAsset {
    publicKey: string;
}

export interface IAssetDelegate extends IAsset {
    username: string;
    url?: string;
}

// TODO rewrite in future
export interface IAssetStake extends IAsset {
    stakeOrder: {
        stakedAmount: number,
        nextVoteMilestone: number,
        startTime: number
    };
    airdropReward: IAirdropAsset;

}

export interface IAssetSendStake extends IAsset {
    recipientId: string;
}

export interface IAssetVote extends IAsset {
    votes: Array<string>;
    reward: number;
    unstake: number;
    airdropReward: IAirdropAsset;
}

interface ITransactionFields <T extends IAsset> {
    id: string;
    blockId: string;
    type: TransactionType;
    senderPublicKey: PublicKey;
    senderAddress: Address;
    recipientAddress: Address;
    signature: string;
    secondSignature: string;
    amount: number;
    createdAt: Timestamp;
    fee: number;
    status?: TransactionStatus;
    salt?: string;
    asset?: T;
}

export class Transaction <T extends IAsset> implements ITransactionFields<object> {
    id: string;
    blockId: string;
    type: TransactionType;
    senderPublicKey: PublicKey;
    senderAddress: Address;
    recipientAddress: Address;
    signature: string;
    secondSignature: string;
    amount: number;
    createdAt: Timestamp;
    fee: number;
    status?: TransactionStatus;
    salt?: string;
    asset: T;

    // todo: convert asset
    constructor(data: ITransactionFields<object>) {
        Object.assign(this, data);
    }
}
