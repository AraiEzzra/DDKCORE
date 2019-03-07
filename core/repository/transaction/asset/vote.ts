import { IAssetVote } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

class TransactionVoteRepo implements IAssetRepository<IAssetVote> {


    serialize(asset: IAssetVote): RawAsset {
        return {
            votes: asset.votes,
            reward: asset.reward,
            unstake: asset.unstake,
            airdropReward: {
                sponsors: [...asset.airdropReward.sponsors]
            }
        };
    }

    deserialize(rawAsset: RawAsset): IAssetVote {
        return {
            votes: rawAsset.votes,
            reward: rawAsset.reward,
            unstake: rawAsset.unstake,
            airdropReward: {
                sponsors: new Map(rawAsset.airdropReward.sponsors)
            }
        };
    }
}

export default new TransactionVoteRepo();
