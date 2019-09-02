import { Timestamp } from 'shared/model/types';
import { SerializedTransaction, Transaction } from 'shared/model/transaction';
import SharedTransactionRepo from 'shared/repository/transaction';
import config from 'shared/config';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferArray, createBufferObject } from 'shared/util/byteSerializer';
import { BufferTypes } from 'shared/util/byteSerializer/types';
import { serializeAssetTransaction } from 'shared/util/transaction';

export class BlockModel {
    id?: string | null = null;
    version?: number = config.CONSTANTS.FORGING.CURRENT_BLOCK_VERSION;
    createdAt: Timestamp;
    height?: number | null = null;
    previousBlockId: string | null;
    transactionCount?: number = 0;
    amount?: number = 0;
    fee?: number = 0;
    payloadHash?: string = '';
    generatorPublicKey?: string = '';
    signature?: string = '';
    relay?: number;
    transactions: Array<Transaction<object>>;

    constructor(data: BlockModel) {
        this.relay = 0;
        this.transactions = [];
        Object.assign(this, data);
    }
}

export type SerializedBlock = {
    id: string;
    version: number;
    createdAt: Timestamp;
    height: number;
    previousBlockId: string;
    transactionCount: number;
    amount: number;
    fee: number;
    payloadHash: string;
    generatorPublicKey: string;
    signature: string;
    relay: number;
    transactions: Array<SerializedTransaction<any>>;
};

export class Block extends BlockModel {
    public getCopy(): Block {
        return new Block({ ...this });
    }

    public serialize = (): SerializedBlock => {
        return {
            id: this.id,
            version: this.version,
            createdAt: this.createdAt,
            height: this.height,
            previousBlockId: this.previousBlockId,
            transactionCount: this.transactionCount,
            amount: this.amount,
            fee: this.fee,
            payloadHash: this.payloadHash,
            generatorPublicKey: this.generatorPublicKey,
            signature: this.signature,
            relay: this.relay,
            transactions: this.transactions.map(trs => SharedTransactionRepo.serialize(trs)),
        };
    }

    public byteSerialize = (): Buffer => {
        const byteAssetsTransactions = this.transactions.map(trs => serializeAssetTransaction(trs));
        const byteBlock = createBufferObject({
            id: this.id,
            version: this.version,
            createdAt: this.createdAt,
            height: this.height,
            previousBlockId: this.previousBlockId,
            transactionCount: this.transactionCount,
            amount: this.amount,
            fee: this.fee,
            payloadHash: this.payloadHash,
            generatorPublicKey: this.generatorPublicKey,
            signature: this.signature,
            relay: this.relay,
            transactions: createBufferArray(
                byteAssetsTransactions,
                new BufferTypes.Object(SchemaName.TransactionBlock)
            ),
        }, SchemaName.Block);
        return byteBlock;
    }

    static deserialize = (block: SerializedBlock): Block => {
        return new Block({
            id: block.id,
            version: block.version,
            createdAt: block.createdAt,
            height: block.height,
            previousBlockId: block.previousBlockId,
            transactionCount: block.transactionCount,
            amount: block.amount,
            fee: block.fee,
            payloadHash: block.payloadHash,
            generatorPublicKey: block.generatorPublicKey,
            signature: block.signature,
            relay: block.relay,
            transactions: block.transactions.map(trs => SharedTransactionRepo.deserialize(trs)),
        });
    }
}
