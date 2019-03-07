import { Block } from 'shared/model/block';

export const generateBlocks = (): Array<Block> => {
    const blocks: Array<Block> = [];
    for (let i = 0; i < 8; i++) {
        blocks.push(generateBlock(i));
    }
    return blocks;
};

const generateBlock = (index: number) => {
    return new Block({
        id: '3276517decd6171565151a3537e69c7e4f8d361050a4caf684dfcd796242757' + index,
        version: 1,
        createdAt: new Date().getTime() / 100,
        height: index + 1,
        previousBlockId: '001d6450cef6257f45171bbaff1d94bf1ddb912fb4c8d9ba0cfb4c4afcf88c2f',
        transactionCount: 0,
        amount: 0,
        fee: 0,
        payloadHash: '',
        generatorPublicKey: '',
        signature: '',
        transactions: null
    });
};
