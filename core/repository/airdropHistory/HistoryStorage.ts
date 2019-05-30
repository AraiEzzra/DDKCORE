import { AVLTree } from 'binary-search-tree';
import { AirdropHistory } from 'core/repository/airdropHistory/interfaces';
import { TransactionId, Timestamp } from 'shared/model/types';

type Where = {
    rewardTime?: {
        $qt?: Timestamp,
        $gte?: Timestamp,
        $lt?: Timestamp,
        $lte?: Timestamp
    }
};

export default class HistoryStorage {

    private readonly storage: Map<TransactionId, AirdropHistory>;

    private readonly rewardTimeIndex: AVLTree;

    constructor() {
        this.storage = new Map();
        this.rewardTimeIndex = new AVLTree();
    }

    add(data: AirdropHistory) {
        this.storage.set(data.transactionId, data);
        this.rewardTimeIndex.insert(data.rewardTime, data);
    }

    remove(data: AirdropHistory) {
        this.storage.get(data.transactionId);
        this.rewardTimeIndex.delete(data.rewardTime);
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
