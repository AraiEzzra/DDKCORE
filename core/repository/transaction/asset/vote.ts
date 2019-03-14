import { IAssetVote } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

class TransactionVoteRepo implements IAssetRepository<IAssetVote> {


    serialize(asset: IAssetVote): RawAsset {
        return {
            votes: asset.votes,
            reward: asset.reward,
            unstake: asset.unstake,
            airdropReward: {
                sponsors: Array.from(asset.airdropReward.sponsors)
                    .map(elem => [elem[0].toString(), elem[1]])
            }
        };
    }

    deserialize(rawAsset: RawAsset): IAssetVote {
        return {
            votes: rawAsset.votes,
            reward: rawAsset.reward,
            unstake: rawAsset.unstake,
            airdropReward: {
                sponsors: new Map(rawAsset.airdropReward.sponsors
                    .map((elem: [string, number]) => [BigInt(elem[0]), elem[1]]))
            }
        };
    }
}

export default new TransactionVoteRepo();
