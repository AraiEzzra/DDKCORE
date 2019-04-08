import { Block } from 'shared/model/block';

export const MIN_ROUND_BLOCK = 2;

export const isLessHeight = (lastBlock: Block, receivedBlock: Block): boolean => {
    return receivedBlock.height < lastBlock.height;
};

export const isNext = (lastBlock: Block, receivedBlock: Block): boolean => {
    return lastBlock.height + 1 === receivedBlock.height;
};

export const isEqualId = (lastBlock: Block, receivedBlock: Block): boolean => {
    return lastBlock.id === receivedBlock.id;
};

export const isEqualPreviousBlock = (lastBlock: Block, receivedBlock: Block): boolean => {
    return lastBlock.previousBlockId === receivedBlock.previousBlockId;
};

export const isEqualHeight = (lastBlock: Block, receivedBlock: Block): boolean => {
    return lastBlock.height === receivedBlock.height;
};

export const isGreatestHeight = (lastBlock: Block, receivedBlock: Block): boolean => {
    return receivedBlock.height > lastBlock.height;
};

export const isLastBlockInvalid = (lastBlock: Block, receivedBlock: Block): boolean => {
    return receivedBlock.previousBlockId !== lastBlock.id && isNext(lastBlock, receivedBlock);
};

export const canBeProcessed = (lastBlock: Block, receivedBlock: Block): boolean => {
    return  receivedBlock.previousBlockId === lastBlock.id && isNext(lastBlock, receivedBlock);
};
