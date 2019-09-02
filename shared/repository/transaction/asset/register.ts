import { IAssetRegister } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject } from 'shared/util/byteSerializer';

class TransactionRegisterRepo implements IAssetRepository<IAssetRegister> {


    serialize(asset: IAssetRegister): RawAsset {
        return {
            referral: asset.referral.toString()
        };
    }

    byteSerialize(asset: IAssetRegister): Buffer {
        return createBufferObject(asset, SchemaName.TransactionAssetRegister);
    }

    deserialize(rawAsset: RawAsset): IAssetRegister {
        return {
            referral: BigInt(rawAsset.referral)
        };
    }
}

export default new TransactionRegisterRepo();
