import { IAssetDelegate } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';

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
