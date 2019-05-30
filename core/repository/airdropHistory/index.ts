import AirdropHistoryRepository from 'core/repository/airdropHistory/AirdropHistoryRepository';
import AirdropHistoryFakeRepository from 'core/repository/airdropHistory/AirdropHistoryFakeRepository';
import {
    AirdropHistory, AirdropDailyHistoryQuery, AirdropHistoryQuery
} from 'core/repository/airdropHistory/interfaces';
import config from 'shared/config';

export {
    AirdropHistoryQuery,
    AirdropHistory,
    AirdropDailyHistoryQuery
};

const gerAirdropHistoryRepository = () => {
    if (config.CORE.IS_REFERRED_USERS_ENABLED) {
        return new AirdropHistoryRepository();
    }
    return new AirdropHistoryFakeRepository();
};

export default gerAirdropHistoryRepository();
