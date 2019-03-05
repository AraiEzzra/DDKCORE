import { expect } from 'chai';
import mockBlock from '../mock/blockService';
import { ed, IKeyPair } from '../../../shared/util/ed';
import {Block} from '../../../shared/model/block';
import BUFFER from '../../../core/util/buffer';
const crypto = require('crypto');

describe('Generate Blocks', () => {
    let KeyPair: IKeyPair;
    const blocks = [];

    before((done) => {
        blocks.push(mockBlock.getLastBlock());
        done();
    });

    it('Create Key pair', () => {
        const hash = crypto.createHash('sha256').update('secret sentences', 'utf8').digest();
        KeyPair = ed.makeKeypair(hash);
        expect(KeyPair).to.be.property('publicKey');
        expect(KeyPair).to.be.property('privateKey');
    });

    it('create', () => {
        for (let i = 0; i < blocks.length; i++) {
            console.log('Step ', i);
            if (blocks.length >= 10) {
                break;
            }
            const body = {
                timestamp: i,
                previousBlock: blocks[blocks.length - 1],
                keypair: KeyPair,
                transactions: []
            };
            const block = create(body);
            block.id = crypto.createHash('sha256').update(getBytes(blocks[i])).digest('hex');
            blocks.push(block);
        }
    });

});

const create = ({transactions, timestamp, previousBlock, keypair}): Block => {
    const blockTransactions = [];
    const block: Block = new Block({
        createdAt: timestamp,
        transactionCount: blockTransactions.length,
        previousBlockId: previousBlock.id,
        generatorPublicKey: keypair.publicKey.toString('hex'),
        transactions: blockTransactions
    });

    return block;
};

const BLOCK_BUFFER_SIZE
    = BUFFER.LENGTH.UINT32 // version
    + BUFFER.LENGTH.INT64 // timestamp
    + BUFFER.LENGTH.DOUBLE_HEX // previousBlockId
    + BUFFER.LENGTH.UINT32 // transactionCount
    + BUFFER.LENGTH.INT64 // amount
    + BUFFER.LENGTH.INT64 // fee
    + BUFFER.LENGTH.HEX // payloadHash
    + BUFFER.LENGTH.HEX // generatorPublicKey
;

const getBytes = (block: Block): Buffer => {
    const buf = Buffer.alloc(BLOCK_BUFFER_SIZE);
    let offset = 0;
    offset = BUFFER.writeInt32LE(buf, block.version, offset);
    offset = BUFFER.writeInt32LE(buf, block.createdAt, offset);

    if (block.previousBlockId) {
        buf.write(block.previousBlockId, offset, BUFFER.LENGTH.DOUBLE_HEX);
    }
    offset += BUFFER.LENGTH.DOUBLE_HEX;
    offset = BUFFER.writeInt32LE(buf, block.transactionCount, offset);
    offset = BUFFER.writeUInt64LE(buf, block.amount, offset);
    offset = BUFFER.writeUInt64LE(buf, block.fee, offset);
    buf.write(block.payloadHash, offset, BUFFER.LENGTH.HEX, 'hex');
    offset += BUFFER.LENGTH.HEX;

    buf.write(block.generatorPublicKey, offset, BUFFER.LENGTH.HEX, 'hex');
    return buf;
};
