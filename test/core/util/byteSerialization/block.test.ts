import { blockModel, blocks } from 'test/core/util/byteSerialization/mock';
import { createBufferArray, deserialize } from 'shared/util/byteSerializer';
import { expect } from 'chai';
import { Block, BlockModel } from 'shared/model/block';
import { BufferTypes } from 'shared/util/byteSerializer/types';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { serializeAssetTransaction } from 'shared/util/transaction';


describe('Block byte serialize', () => {


    it('Block', () => {
        const block = new Block(blockModel);
        const byteBlock: Buffer = block.byteSerialize();

        expect(deserialize(byteBlock)).to.deep.equal(blockModel);
    });

    it('Blocks array', () => {
        const blocksCopy = blocks.map(block => new BlockModel(block));

        blocksCopy.forEach((block: any) => {
            block.transactions = block.transactions.map(trs => serializeAssetTransaction(trs));
            block.transactions = createBufferArray(
                block.transactions,
                new BufferTypes.Object(SchemaName.TransactionBlock)
            );
        });

        const byteArrayBlock = createBufferArray(blocksCopy, new BufferTypes.Object(SchemaName.Block));

        expect(deserialize(byteArrayBlock)).to.deep.equal(blocks);
    });
});
