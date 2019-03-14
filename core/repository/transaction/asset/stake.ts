import { IAssetStake } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

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
