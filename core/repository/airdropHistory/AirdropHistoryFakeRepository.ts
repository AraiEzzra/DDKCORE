import {
    IAirdropHistoryRepository,
    AirdropHistoryQuery,
    AirdropHistory,
    AirdropDailyHistory,
    AirdropDailyHistoryQuery,
} from 'shared/repository/airdropHistory/interfaces';

export default class AirdropHistoryFakeRepository implements IAirdropHistoryRepository {

    add(data: AirdropHistory) {}

    clear(): void {}

    remove(data: AirdropHistory) {}

    getDailyHistory(query: AirdropDailyHistoryQuery): ReadonlyArray<AirdropDailyHistory> {
        return [];
    }

    getHistory(query: AirdropHistoryQuery): ReadonlyArray<AirdropHistory> {
        return [];
    }
}
