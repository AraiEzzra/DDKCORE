import { IAsset, Transaction, TransactionType } from 'shared/model/transaction';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject } from 'shared/util/byteSerializer';

export const serializeAssetTransaction = (trs: Transaction<IAsset>) => {

    let assetSchema: SchemaName;
    switch (trs.type) {
        case TransactionType.REGISTER:
            assetSchema = SchemaName.TransactionAssetRegister;
            break;
        case TransactionType.SEND:
            assetSchema = SchemaName.TransactionAssetSend;
            break;
        case TransactionType.SIGNATURE:
            assetSchema = SchemaName.TransactionAssetSignature;
            break;
        case TransactionType.DELEGATE:
            assetSchema = SchemaName.TransactionAssetDelegate;
            break;
        case TransactionType.STAKE:
            assetSchema = SchemaName.TransactionAssetStake;
            break;
        case TransactionType.VOTE:
            assetSchema = SchemaName.TransactionAssetVote;
            break;
        default:
            assetSchema = SchemaName.Empty;
    }
    return {...trs, asset: createBufferObject(trs.asset, assetSchema)};
}
