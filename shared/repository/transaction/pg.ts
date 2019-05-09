import { IAsset, Transaction } from 'shared/model/transaction';
import SharedTransactionRepo from 'shared/repository/transaction';
import { RawTransaction } from 'shared/model/types';

class SharedTransactionPGRepo  {

    serialize(trs: Transaction<IAsset>): object {
        const serializedTrs = SharedTransactionRepo.serialize(trs);
        return {
            id: serializedTrs.id,
            block_id: serializedTrs.blockId,
            type: serializedTrs.type,
            created_at: serializedTrs.createdAt,
            sender_public_key: serializedTrs.senderPublicKey,
            signature: serializedTrs.signature,
            second_signature: serializedTrs.secondSignature,
            fee: serializedTrs.fee,
            salt: serializedTrs.salt,
            asset: serializedTrs.asset
        };
    }

    deserialize(rawTrs: RawTransaction): Transaction<IAsset> {
        return SharedTransactionRepo.deserialize({
            id: rawTrs.id,
            blockId: rawTrs.block_id,
            type: Number(rawTrs.type),
            createdAt: Number(rawTrs.created_at),
            senderPublicKey: rawTrs.sender_public_key,
            signature: rawTrs.signature,
            secondSignature: rawTrs.second_signature,
            fee: Number(rawTrs.fee),
            salt: rawTrs.salt,
            asset: rawTrs.asset,
            confirmations: Number(rawTrs.confirmations)
        });
    }
}

export default new SharedTransactionPGRepo();
