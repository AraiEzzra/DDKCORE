import { AVLTree } from 'binary-search-tree';
import { AirdropHistory } from 'shared/repository/airdropHistory/interfaces';
import { TransactionId, Timestamp } from 'shared/model/types';

type Where = {
    rewardTime?: {
        $qt?: Timestamp,
        $gte?: Timestamp,
        $lt?: Timestamp,
        $lte?: Timestamp
    }
};

export default class AirdropHistoryStorage {

    private readonly storage: Map<TransactionId, AirdropHistory>;

    private rewardTimeIndex: AVLTree;

    constructor() {
        this.storage = new Map();
        this.rewardTimeIndex = new AVLTree();
    }

    add(data: AirdropHistory) {
        this.storage.set(data.transactionId, data);
        this.rewardTimeIndex.insert(data.rewardTime, data);
    }

    remove(data: AirdropHistory) {
        this.storage.delete(data.transactionId);
        this.rewardTimeIndex.delete(data.rewardTime);
    }

    clear() {
        this.storage.clear();
        this.rewardTimeIndex = new AVLTree();
    }

    [Symbol.iterator]() {
        return this.storage.values();
    }

    find(where: Where): Array<AirdropHistory> {
        if (where.rewardTime) {
            return this.rewardTimeIndex.betweenBounds(where.rewardTime);
        }
        return [...this.storage.values()];
    }
}
