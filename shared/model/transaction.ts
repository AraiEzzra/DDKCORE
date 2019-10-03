import { Account} from 'shared/model/account';
import { getAddressByPublicKey } from 'shared/util/account';
import {
    Address,
    AirdropReward,
    PublicKey,
    Timestamp,
    TransactionHistoryEvent,
    TransactionId
} from 'shared/model/types';
import config from 'shared/config';
import { BlockId } from 'shared/repository/block';

export enum VoteType {
    VOTE = '+',
    DOWN_VOTE = '-'
}

export enum TransactionType {
    REGISTER = 0,
    SEND = 10,
    SIGNATURE = 20,
    DELEGATE = 30,
    STAKE = 40,
    // SENDSTAKE = 50,
    VOTE = 60,
}

export enum TransactionLifecycle {
    VALIDATE = 'VALIDATE',
    CREATE = 'CREATE',
    PUSH_IN_QUEUE = 'PUSH_IN_QUEUE',
    PROCESS = 'PROCESS',
    PUSH_IN_CONFLICTED_QUEUE = 'PUSH_IN_CONFLICTED_QUEUE',
    VERIFY = 'VERIFY',
    DECLINE = 'DECLINE',
    PUSH_IN_POOL = 'PUSH_IN_POOL',
    CHECK_TRS_FOR_EXIST_POOL = 'CHECK_TRS_FOR_EXIST_POOL',
    RETURN_TO_QUEUE = 'RETURN_TO_QUEUE',
    REMOVED_BY_SENDER_ADDRESS = 'REMOVED_BY_SENDER_ADDRESS',
    REMOVED_BY_RECIPIENT_ADDRESS = 'REMOVED_BY_RECIPIENT_ADDRESS',
    POP_FOR_BLOCK = 'POP_FOR_BLOCK',
    APPLY_UNCONFIRMED = 'APPLY_UNCONFIRMED',
    UNDO_UNCONFIRMED = 'UNDO_UNCONFIRMED',
    UNDO_BY_FAILED_APPLY = 'UNDO_BY_FAILED_APPLY',
    VIRTUAL_UNDO_UNCONFIRMED = 'VIRTUAL_UNDO_UNCONFIRMED',
    APPLY = 'APPLY',
    UNDO = 'UNDO',
}

export enum BlockLifecycle {
    VALIDATE = 'VALIDATE',
    CREATE = 'CREATE',
    RECEIVE = 'RECEIVE',
    PROCESS = 'PROCESS',
    VERIFY = 'VERIFY',
    APPLY = 'APPLY',
    UNDO = 'UNDO',
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
    DECLINED,
}

export interface IAirdropAsset {
    sponsors: Map<Address, number>;
}

export interface IAsset {
}

export interface IAssetRegister extends IAsset {
    referral: Address;
}

export interface IAssetTransfer extends IAsset {
    recipientAddress: Address;
    amount: number;
}

export interface IAssetSignature extends IAsset {
    publicKey: PublicKey;
}

export interface IAssetDelegate extends IAsset {
    username: string;
    url?: string;
}

// TODO rewrite in future
export interface IAssetStake extends IAsset {
    amount: number;
    startTime: number;
    startVoteCount: number;
    airdropReward?: IAirdropAsset;
}

export interface IAssetSendStake extends IAsset {
    recipientAddress: string;
}

export interface IAssetVote extends IAsset {
    votes: Array<string>;
    type?: VoteType;
    reward?: number;
    unstake?: number;
    airdropReward?: IAirdropAsset;
}

export class TransactionModel<T extends IAsset> {
    id?: TransactionId;
    blockId?: BlockId;
    type: TransactionType;
    senderPublicKey?: PublicKey;
    senderAddress?: Address; // Memory only
    signature?: string;
    secondSignature?: string;
    createdAt?: Timestamp;
    fee?: number = 0; // Memory only
    status?: TransactionStatus; // Memory only
    salt?: string;
    relay?: number; // Memory only
    confirmations?: number;
    asset?: T;

    constructor(data: TransactionModel<T>) {
        this.relay = 0;
        this.confirmations = 0;
        this.senderAddress = data.senderAddress ? data.senderAddress : getAddressByPublicKey(data.senderPublicKey);
        Object.assign(this, data);
    }
}

export class Transaction<T extends IAsset = any> extends TransactionModel<T> {
    constructor(data: TransactionModel<T>) {
        super(data);
    }

    public getCopy() {
        return new Transaction<T>({ ...this });
    }
}

export type SerializedTransaction<T> = {
    id: string;
    blockId: string;
    type: TransactionType;
    createdAt: Timestamp;
    senderPublicKey: PublicKey;
    senderAddress: string;
    signature: string;
    secondSignature: string;
    fee: number;
    salt: string;
    relay: number;
    confirmations: number,
    asset: T;
};

export type StakeSchema = {
    createdAt: Timestamp;
    isActive: boolean;
    amount: number;
    voteCount: number;
    nextVoteMilestone: Timestamp;
    airdropReward: AirdropReward;
    sourceTransactionId: string;
};

export class Stake {
    createdAt: Timestamp;
    isActive: boolean;
    amount: number;
    voteCount: number;
    nextVoteMilestone: Timestamp;
    airdropReward: AirdropReward;
    sourceTransactionId: string;
    dependentTransactions: Array<Transaction<IAssetVote>>;

    constructor(data: StakeSchema) {
        this.createdAt = data.createdAt;
        this.isActive = data.isActive;
        this.amount = data.amount;
        this.voteCount = data.voteCount;
        this.nextVoteMilestone = data.nextVoteMilestone;
        this.airdropReward = data.airdropReward;
        this.sourceTransactionId = data.sourceTransactionId;
        this.dependentTransactions = [];
    }
}
