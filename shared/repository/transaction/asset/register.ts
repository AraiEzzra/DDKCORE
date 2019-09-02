import { IAssetRegister } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';

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
