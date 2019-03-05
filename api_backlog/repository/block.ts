import { Block } from 'shared/model/block';

class BlockRepo {

    constructor() {}

    public getById(id: string): Block { return undefined; }

    public countList(where, params): number { return undefined; }

    public list(filter, params): Block[] { return undefined; }
}

export default new BlockRepo();
