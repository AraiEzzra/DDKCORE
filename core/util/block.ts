import { Block } from 'shared/model/block';

export const isHeightLess = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (receivedBlock.height < lastBlock.height) {
        return true;
    }
    return false;
};

const isNext = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (lastBlock.height + 1 === receivedBlock.height) {
        return true;
    }
    return false;
};

export const isEqualId = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (lastBlock.id === receivedBlock.id) {
        return true;
    }
    return false;
};

export const isEqualPreviousBlock = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (lastBlock.previousBlockId === receivedBlock.previousBlockId) {
        return true;
    }
    return false;
};

export const isEqualHeight = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (lastBlock.height === receivedBlock.height) {
        return true;
    }
    return false;
};

export const isReceivedBlockAbove = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (receivedBlock.height > lastBlock.height) {
        return true;
    }
    return false;
};

export const isLastBlockInvalid = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (receivedBlock.previousBlockId !== lastBlock.id && isNext(lastBlock, receivedBlock)) {
        return true;
    }
    return false;
};

export const canBeProcessed = (lastBlock: Block, receivedBlock: Block): boolean => {
    if (receivedBlock.previousBlockId === lastBlock.id && isNext(lastBlock, receivedBlock)) {
        return true;
    }
    return false;
};
