import { IAssetTransfer } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject } from 'shared/util/byteSerializer';

class TransactionSendRepo implements IAssetRepository<IAssetTransfer> {


    serialize(asset: IAssetTransfer): RawAsset {
        return {
            recipientAddress: asset.recipientAddress.toString(),
            amount: asset.amount
        };
    }

    byteSerialize(asset: IAssetTransfer): Buffer {
        return createBufferObject(asset, SchemaName.TransactionAssetSend);
    }

    deserialize(rawAsset: RawAsset): IAssetTransfer {
        return {
            recipientAddress: BigInt(rawAsset.recipientAddress),
            amount: rawAsset.amount
        };
    }
}

export default new TransactionSendRepo();
