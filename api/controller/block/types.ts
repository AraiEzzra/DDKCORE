import { Block } from 'shared/model/block';

export type reqGetBlocks = {
    limit: number;
    offset: number;
    sort?: string;
};

export type resGetBlocks = {
    blocks: Array<Block>;
    total_count: number;
};

