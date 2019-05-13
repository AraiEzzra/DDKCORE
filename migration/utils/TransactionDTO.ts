import { PublicKey, Timestamp } from 'shared/model/account';
import { IAsset, TransactionModel, TransactionType } from 'shared/model/transaction';

export class TransactionDTO {
    id?: string;
    blockId?: string;
    type: TransactionType;
    senderPublicKey?: PublicKey;
    signature?: string;
    createdAt?: Timestamp;
    salt?: string;
    relay?: number;
    secondSignature?: string;
    asset?: IAsset;
    height?: number;

    constructor(data: TransactionModel<IAsset>) {
        this.id = data.id;
        this.relay = 0;
        this.type = Number(data.type);
        this.senderPublicKey = data.senderPublicKey.replace(/DDK/ig, '');
        this.signature = data.signature;
        this.createdAt = Number(data.createdAt);
        this.salt = data.salt;
        this.secondSignature = data.secondSignature || '';
        this.asset = data.asset;
        this.height = Number(data.height);
    }
}
