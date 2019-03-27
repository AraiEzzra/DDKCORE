import { IAssetDelegate } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

class TransactionDelegateRepo implements IAssetRepository<IAssetDelegate> {


    serialize(asset: IAssetDelegate): RawAsset {
        return {
            username: asset.username
        };
    }

    deserialize(rawAsset: RawAsset): IAssetDelegate {
        return {
            username: rawAsset.username
        };
    }
}

export default new TransactionDelegateRepo();
