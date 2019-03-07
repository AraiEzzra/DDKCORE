import { IAssetTransfer } from 'shared/model/transaction';
import { IAssetRepository, RawAsset } from 'shared/repository/transaction';

class TransactionSendRepo implements IAssetRepository<IAssetTransfer> {


    serialize(asset: IAssetTransfer): RawAsset {
        return {
            recipientAddress: asset.recipientAddress.toString(),
            amount: asset.amount
        };
    }

    deserialize(rawAsset: RawAsset): IAssetTransfer {
        return {
            recipientAddress: BigInt(rawAsset.recipientAddress),
            amount: rawAsset.amount
        };
    }
}

export default new TransactionSendRepo();
