import { Block } from 'shared/model/block';
import BlockService from 'core/service/block';
import TransactionService from 'core/service/transaction';
import BlockRepo from 'core/repository/block';
import {TransactionType} from 'shared/model/transaction';

const keyPair = {
    publicKey: '49a2b5e68f851a11058748269a276b0c0d36497215548fb40d4fe4e929d0283a',
    privateKey: 'sad case cement sign ghost bamboo soap depart discover acoustic spot toilet'
};

const keyPairTrs = {
    publicKey: Buffer.from(keyPair.publicKey),
    privateKey: Buffer.from(keyPair.privateKey),
};

let lastBlock = null;
export const restartIteration = () => { lastBlock = null; };
export const getNewBlock = (): Block => {
    lastBlock = lastBlock || BlockRepo.getLastBlock();
    let block = BlockService.create({
        keyPair: keyPair,
        previousBlock: lastBlock,
        timestamp: Math.floor(Date.now() / 1000),
        transactions: [TransactionService.create({
            type: TransactionType.SEND,
            senderAddress: 10000000000n,
            asset: {
                amount: Math.floor(Math.random() * 10000000),
                recipientAddress: 99999999999n
            }
        }, keyPairTrs).data]
    });
    block = BlockService.setHeight(block, lastBlock);
    block = BlockService.addPayloadHash(block, keyPair).data;
    lastBlock = block;
    return block;
};
