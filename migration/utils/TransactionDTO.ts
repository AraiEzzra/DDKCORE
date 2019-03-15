import { PublicKey, Timestamp } from 'shared/model/account';
import { IAsset, IAssetVote, TransactionModel, TransactionType } from 'shared/model/transaction';

export class TransactionDTO {
    id?: string;
    blockId?: string;
    type: TransactionType;
    senderPublicKey?: PublicKey;
    signature?: string;
    createdAt?: Timestamp;
    salt?: string;
    relay?: number;
    asset?: IAsset;
    // airdropReward: any;
    // referrals: any;
    // recipientAddress: any;
    // amount: any;
    // secondPublicKey: any;
    // username: any;
    // startTime: any;
    // reward: any;
    // unstake: any;

    constructor(data: TransactionModel<IAssetVote>) {
        this.id = data.id;
        this.relay = 0;
        this.type = Number(data.type);
        this.senderPublicKey = data.senderPublicKey;
        this.signature = data.signature;
        this.createdAt = Number(data.createdAt);
        this.salt = data.salt;
        this.asset = data.asset;
    }
}
