import { IAssetDelegate } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject } from 'shared/util/byteSerializer';

class TransactionDelegateRepo implements IAssetRepository<IAssetDelegate> {


    serialize(asset: IAssetDelegate): RawAsset {
        return {
            username: asset.username
        };
    }

    byteSerialize(asset: IAssetDelegate): Buffer {
        return createBufferObject(asset, SchemaName.TransactionAssetDelegate);
    }

    deserialize(rawAsset: RawAsset): IAssetDelegate {
        return {
            username: rawAsset.username
        };
    }
}

export default new TransactionDelegateRepo();
