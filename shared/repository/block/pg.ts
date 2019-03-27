import { Block } from 'shared/model/block';
import { RawBlock } from 'shared/repository/block/index';

class SharedBlockPgRepository {
    serialize(block: Block): RawBlock {
        return {
            id: block.id,
            version: block.version,
            created_at: block.createdAt,
            height: block.height,
            previous_block_id: block.previousBlockId,
            transaction_count: block.transactionCount,
            amount: block.amount,
            fee: block.fee,
            payload_hash: block.payloadHash,
            generator_public_key: block.generatorPublicKey,
            signature: block.signature
        };
    }

    deserialize(rawBlock: RawBlock): Block {
        return new Block({
            id: rawBlock.id,
            version: Number(rawBlock.version),
            createdAt: Number(rawBlock.created_at),
            height: Number(rawBlock.height),
            previousBlockId: rawBlock.previous_block_id,
            transactionCount: Number(rawBlock.transaction_count),
            amount: Number(rawBlock.amount),
            fee: Number(rawBlock.fee),
            payloadHash: rawBlock.payload_hash,
            generatorPublicKey: rawBlock.generator_public_key,
            signature: rawBlock.signature,
            transactions: []
        });
    }

}

export default new SharedBlockPgRepository();
