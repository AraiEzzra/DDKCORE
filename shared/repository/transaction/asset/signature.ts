import { IAssetSignature } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject } from 'shared/util/byteSerializer';

class TransactionSignatureRepo implements IAssetRepository<IAssetSignature> {

    serialize(asset: IAssetSignature): RawAsset {
        return {
            publicKey: asset.publicKey
        };
    }

    byteSerialize(asset: IAssetSignature): Buffer {
        return createBufferObject(asset, SchemaName.TransactionAssetSignature);
    }

    deserialize(rawAsset: RawAsset): IAssetSignature {
        return {
            publicKey: rawAsset.publicKey
        };
    }
}

export default new TransactionSignatureRepo();
