import { IAssetStake } from 'shared/model/transaction';
import { IAssetRepository } from 'shared/repository/transaction';
import { RawAsset } from 'shared/model/types';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject } from 'shared/util/byteSerializer';

class TransactionStakeRepo implements IAssetRepository<IAssetStake> {


    serialize(asset: IAssetStake): RawAsset {
        return {
            amount: asset.amount,
            startTime: asset.startTime,
            startVoteCount: asset.startVoteCount,
            airdropReward: {
                sponsors: Array.from(asset.airdropReward.sponsors)
                    .map(elem => [elem[0].toString(), elem[1]])
            }
        };
    }

    byteSerialize(asset: IAssetStake): Buffer {
        return createBufferObject(asset, SchemaName.TransactionAssetStake);
    }

    deserialize(rawAsset: RawAsset): IAssetStake {
        return {
            amount: rawAsset.amount,
            startTime: rawAsset.startTime,
            startVoteCount: rawAsset.startVoteCount,
            airdropReward: {
                sponsors: new Map(rawAsset.airdropReward.sponsors
                    .map((elem: [string, number]) => [BigInt(elem[0]), elem[1]]))
            }
        };
    }
}

export default new TransactionStakeRepo();
