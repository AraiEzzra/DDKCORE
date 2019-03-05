import { getTransactionServiceByType } from 'core/util/transaction';
import {Account, Address, PublicKey, Timestamp} from 'shared/model/account';
import {IAssetService} from 'core/service/transaction';
import AccountRepo from 'core/repository/account';

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

export interface IAirdropAsset {
    sponsors: { [sponsorAddress: number]: number };
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
    recipientId: string;
}

export interface IAssetVote extends IAsset {
    votes: Array<string>;
    reward?: number;
    unstake?: number;
    airdropReward?: IAirdropAsset;
}

export class TransactionModel<T extends IAsset> {
    id?: string;
    blockId: string;
    type: TransactionType;
    senderPublicKey: PublicKey;
    senderAddress?: Address; // Memory only
    signature?: string;
    secondSignature?: string;
    createdAt?: Timestamp;
    fee?: number; // Memory only
    status?: TransactionStatus; // Memory only
    salt?: string;
    asset?: T;

    constructor(data: TransactionModel<T>) {
        Object.assign(this, data);
    }
}

export class Transaction<T extends IAsset> extends TransactionModel<T> {

    constructor(data: TransactionModel<T>) {
        super(data);
        const sender: Account = AccountRepo.getByPublicKey(data.senderPublicKey);
        this.senderAddress = sender.address;
        const service: IAssetService<IAsset> = getTransactionServiceByType(data.type);
        this.fee = service.calculateFee(this, sender);
    }

    public getCopy() {
        return new Transaction<T>(this);
    }
}
