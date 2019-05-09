import { Account, Address, PublicKey, Timestamp } from 'shared/model/account';
import { getAddressByPublicKey } from 'shared/util/account';
import { TransactionHistoryAction } from 'shared/model/types';
import config from 'shared/config';

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
    CREATE = 'CREATE',
    APPLY_UNCONFIRMED = 'APPLY_UNCONFIRMED',
    UNDO_UNCONFIRMED = 'UNDO_UNCONFIRMED',
    VIRTUAL_UNDO_UNCONFIRMED = 'VIRTUAL_UNDO_UNCONFIRMED',
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
    id?: string;
    blockId?: string;
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

export class Transaction<T extends IAsset> extends TransactionModel<T> {

    history: Array<TransactionHistoryAction> = [];

    constructor(data: TransactionModel<T>) {
        super(data);
    }

    public getCopy() {
        return new Transaction<T>({ ...this, history: [] });
    }

    addHistory(action: TransactionLifecycle): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        this.history.push({ action });
    }

    addBeforeHistory(action: TransactionLifecycle, account: Account): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        this.history.push({
            action,
            accountStateBefore: account.historify(),
        });
    }

    addAfterHistory(action: TransactionLifecycle, account: Account): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].action === action) {
                this.history[i].accountStateAfter = account.historify();
                break;
            }
        }
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
