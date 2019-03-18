import { IAssetSignature } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

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
