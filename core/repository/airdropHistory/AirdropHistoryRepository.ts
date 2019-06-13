import { Address, Timestamp } from 'shared/model/types';
import SlotService from 'core/service/slot';
import {
    IAirdropHistoryRepository,
    AirdropHistoryQuery,
    AirdropHistory,
    AirdropDailyHistory,
    AirdropDailyHistoryQuery,
} from 'shared/repository/airdropHistory/interfaces';
import AirdropHistoryStorage from 'core/repository/airdropHistory/AirdropHistoryStorage';

type AirdropHistoryByAddress = Map<Address, AirdropHistoryStorage>;

export default class AirdropHistoryRepository implements IAirdropHistoryRepository {

    private readonly storage: AirdropHistoryByAddress;

    constructor() {
        this.storage = new Map();
    }

    private getStorage(referralAddress: Address) {
        if (!this.storage.has(referralAddress)) {
            this.storage.set(referralAddress, new AirdropHistoryStorage());
        }
        return this.storage.get(referralAddress);
    }

    add(data: AirdropHistory) {
        this.getStorage(data.referralAddress).add(data);
    }

    remove(data: AirdropHistory) {
        this.getStorage(data.referralAddress).remove(data);
    }

    clear() {
        this.storage.clear();
    }

    getDailyHistory(query: AirdropDailyHistoryQuery): ReadonlyArray<AirdropDailyHistory> {
        const storage = this.getStorage(query.referralAddress);
        const groupByDate = new Map<Timestamp, AirdropDailyHistory>();

        for (const item of storage) {
            const realTime = SlotService.getRealTime(item.rewardTime);
            const startOfDay = new Date(realTime).setHours(0, 0, 0, 0);

            const history = groupByDate.get(startOfDay) || {
                rewardAmount: 0,
                rewardTime: startOfDay,
                usersCount: 0
            };

            history.rewardAmount += item.rewardAmount;
            history.usersCount ++;

            groupByDate.set(startOfDay, history);
        }

        return [...groupByDate.values()].sort((a, b) => a.rewardTime - b.rewardTime);
    }

    getHistory(query: AirdropHistoryQuery): ReadonlyArray<AirdropHistory> {
        const storage = this.getStorage(query.referralAddress);

        const where = {
            rewardTime: {
                $gte: SlotService.getTime(query.startTime),
                $lte: SlotService.getTime(query.endTime)
            }
        };

        return storage.find(where);
    }
}
