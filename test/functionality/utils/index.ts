import RoundService from 'core/service/round';
import RoundRepository from 'core/repository/round';
import BlockRepo from 'core/repository/block';
import BlockPGRepo from 'core/repository/block/pg';
import BlockController from 'core/controller/block';

export const EXPECTED_BLOCK = {
    id: 'bf230d87d2c346a598b6547e7dcbea3d52baac4dea6b1e8254ed87950c991ca4',
    version: 1,
    height: 2,
    transactionCount: 0,
    amount: 0,
    fee: 0,
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    generatorPublicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
    signature: 'eb76d2ad7cd5f609f230c2eeaac26ead13b8893ad411f99a4aaf2205d4776' +
        'c3ea2bac640d84d760002e2c1014d92213679d99784c8905ec58d601e1b481a9205',
    relay: 1,
    transactions: [],
    createdAt: 106350850,
    previousBlockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
    history: []
};

const abc = {
    'slots': {
        '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05': {
            'slot': 10635086,
            'isForged': false
        },
        'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7': {
            'slot': 10635087,
            'isForged': false
        },
        '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a': {
            'slot': 10635088,
            'isForged': false
        }
    }
};

const bcd = {
    'slots': {
        '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05': {
            'slot': 10635086,
            'isForged': false
        },
        'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7': {
            'slot': 10635087,
            'isForged': false },
        '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a': {
            'slot': 10635088,
            'isForged': false }
    }
};

export const clean = async () => {
    RoundService.restore();
    RoundRepository.deleteLastRound();
    const memoryBlock = BlockRepo.getLastBlock();
    if (memoryBlock && memoryBlock.height !== 1) {
        BlockRepo.deleteLastBlock();
    }
    const pgBlock = await BlockPGRepo.getLastBlock();
    if (pgBlock && pgBlock.height !== 1) {
        await BlockPGRepo.deleteById(pgBlock.id);
    }
};

export const applyBlock = async () => {
    return BlockController.onReceiveBlock({ data: { block: EXPECTED_BLOCK } });
};
