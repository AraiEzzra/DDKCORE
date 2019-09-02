import { IAssetSignature } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';

class TransactionSignatureRepo implements IAssetRepository<IAssetSignature> {

    serialize(asset: IAssetSignature): RawAsset {
        return {
            publicKey: asset.publicKey
        };
    }

    deserialize(rawAsset: RawAsset): IAssetSignature {
        return {
            publicKey: rawAsset.publicKey
        };
    }
}

export default new TransactionSignatureRepo();
