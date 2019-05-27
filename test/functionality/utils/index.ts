import RoundService from 'core/service/round';
import RoundRepository from 'core/repository/round';
import BlockRepo from 'core/repository/block';
import BlockPGRepo from 'core/repository/block/pg';
import BlockController from 'core/controller/block';

export const TEST_BLOCK = {
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

export const NEW_TEST_BLOCK = {
    id: 'a812aa26c263342d7ce46b4e27b0aef30f9b50c2f83d16e91ce421f16714ba14',
    version: 1,
    height: 2,
    transactionCount: 0,
    amount: 0,
    fee: 0,
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    generatorPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
    signature: 'c1759a2a02d1cc98693cf4a485981a21afb64a207b8c66aa86f' +
        '0e5ca208a2c58c2759c7c6376361b5dd130fc322dd30111cab2c152e4e1a866c6f017d86c4805',
    relay: 2,
    transactions: [],
    createdAt: 106935890,
    previousBlockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
    history: []
};

export const BLOCK_HEIGHT_3 = {
    id: '24d5a3683a28e4de66aa72d9a55a4877230cda0f62a12e8e04baef4fa9e82ae6',
    version: 1,
    height: 3,
    transactionCount: 0,
    amount: 0,
    fee: 0,
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    generatorPublicKey: 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
    signature: '0349139c78c906799d82271f4d36a8a18f39661ba7972f3d5bc29e36' +
        '563d7ac91bc2fb0924c85e009065a025a7df3602fa648b027e59d6db830745c1f8262104',
    relay: 2,
    transactions: [],
    createdAt: 106935900,
    previousBlockId: 'a812aa26c263342d7ce46b4e27b0aef30f9b50c2f83d16e91ce421f16714ba14',
    history: []
};

export const NEW_BLOCK_HEIGHT_3 = {
    id: '14c071302cc9162a7bc6543635000dd97d24f8e220cba2952350efd41137f12a',
    version: 1,
    height: 3,
    transactionCount: 0,
    amount: 0,
    fee: 0,
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    generatorPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
    signature: '7f482713fc56eba6371587070a3c6b0caef4ccf56ca486edd' +
        'd7c300074e5041f47b311826c6e32f65335e483237b46a4a6e2be2c4898452bebe175376f879e06',
    relay: 2,
    transactions: [],
    createdAt: 106936650,
    previousBlockId: 'a812aa26c263342d7ce46b4e27b0aef30f9b50c2f83d16e91ce421f16714ba14',
    history: []
};


export const clean = async () => {
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
    return BlockController.onReceiveBlock({ data: { block: NEW_TEST_BLOCK } });
};
