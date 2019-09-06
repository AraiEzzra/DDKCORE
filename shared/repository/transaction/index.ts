import { IAsset, SerializedTransaction, Transaction, TransactionType } from 'shared/model/transaction';
import TransactionDelegateRepo from 'shared/repository/transaction/asset/delegate';
import TransactionRegisterRepo from 'shared/repository/transaction/asset/register';
import TransactionSignatureRepo from 'shared/repository/transaction/asset/signature';
import TransactionSendRepo from 'shared/repository/transaction/asset/send';
import TransactionStakeRepo from 'shared/repository/transaction/asset/stake';
import TransactionVoteRepo from 'shared/repository/transaction/asset/vote';
import { getAddressByPublicKey } from 'shared/util/account';
import { RawAsset, RawTransaction } from 'shared/model/types';

const ASSET_REPOSITORIES: { [key: string]: IAssetRepository<IAsset> } = {
    [TransactionType.REGISTER]: TransactionRegisterRepo,
    [TransactionType.SEND]: TransactionSendRepo,
    [TransactionType.SIGNATURE]: TransactionSignatureRepo,
    [TransactionType.DELEGATE]: TransactionDelegateRepo,
    [TransactionType.STAKE]: TransactionStakeRepo,
    [TransactionType.VOTE]: TransactionVoteRepo,
};

export interface IAssetRepository<T extends IAsset> {
    serialize(asset: T): RawAsset;

    deserialize(rawAsset: RawAsset): T;
}

class SharedTransactionRepo {
    serialize(trs: Transaction<IAsset>): SerializedTransaction<IAsset> {
        const assetRepo: IAssetRepository<IAsset> = ASSET_REPOSITORIES[trs.type];
        let asset = trs.asset;
        if (assetRepo) {
            asset = assetRepo.serialize(trs.asset);
        }
        return {
            id: trs.id,
            blockId: trs.blockId,
            type: trs.type,
            createdAt: trs.createdAt,
            senderPublicKey: trs.senderPublicKey,
            senderAddress: (trs.senderAddress || getAddressByPublicKey(trs.senderPublicKey)).toString(),
            signature: trs.signature,
            secondSignature: trs.secondSignature,
            fee: trs.fee,
            salt: trs.salt,
            relay: trs.relay,
            confirmations: trs.confirmations,
            asset: asset,
        };
    }

    deserialize(rawTrs: RawTransaction): Transaction<IAsset> {
        const assetRepo: IAssetRepository<IAsset> = ASSET_REPOSITORIES[rawTrs.type];
        let asset = rawTrs.asset;
        if (assetRepo) {
            asset = assetRepo.deserialize(rawTrs.asset);
        }
        return new Transaction<IAsset>({
            id: rawTrs.id,
            blockId: rawTrs.blockId,
            type: Number(rawTrs.type),
            createdAt: Number(rawTrs.createdAt),
            senderPublicKey: rawTrs.senderPublicKey,
            senderAddress: rawTrs.senderAddress
                ? BigInt(rawTrs.senderAddress)
                : getAddressByPublicKey(rawTrs.senderPublicKey),
            signature: rawTrs.signature,
            secondSignature: rawTrs.secondSignature,
            fee: Number(rawTrs.fee),
            salt: rawTrs.salt,
            relay: rawTrs.relay || 0,
            confirmations: rawTrs.confirmations,
            asset: asset,
        });
    }
}

export default new SharedTransactionRepo();
