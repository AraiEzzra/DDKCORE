import { IAssetRegister } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

class TransactionRegisterRepo implements IAssetRepository<IAssetRegister> {


    serialize(asset: IAssetRegister): RawAsset {
        return {
            referral: asset.referral.toString()
        };
    }

    deserialize(rawAsset: RawAsset): IAssetRegister {
        return {
            referral: BigInt(rawAsset.referral)
        };
    }
}

export default new TransactionRegisterRepo();
