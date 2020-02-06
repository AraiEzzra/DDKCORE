import AirdropHistoryRepository from 'core/repository/airdropHistory/AirdropHistoryRepository';
import AirdropHistoryFakeRepository from 'core/repository/airdropHistory/AirdropHistoryFakeRepository';
import {
    AirdropHistory, AirdropDailyHistoryQuery, AirdropHistoryQuery, IAirdropHistoryRepository
} from 'shared/repository/airdropHistory/interfaces';
import config from 'shared/config';
import { isARPEnabled } from 'core/util/feature';
import { AirdropType } from 'ddk.registry/dist/model/common/airdrop';

export {
    AirdropHistoryQuery,
    AirdropHistory,
    AirdropDailyHistoryQuery,
    IAirdropHistoryRepository
};

class AirdropHistoryFactory {
    private readonly fake: IAirdropHistoryRepository;
    private readonly airdrop: IAirdropHistoryRepository;
    private readonly arp: IAirdropHistoryRepository;

    constructor() {
        this.fake = new AirdropHistoryFakeRepository();
        this.airdrop = new AirdropHistoryRepository();
        this.arp = new AirdropHistoryRepository();
    }

    get(type?: AirdropType): IAirdropHistoryRepository {
        if (!config.CORE.IS_REFERRED_USERS_ENABLED) {
            return this.fake;
        }

        if (type) {
            switch (type) {
                case AirdropType.AIRDROP:
                    return this.airdrop;
                case AirdropType.ARP:
                    return this.arp;
                default:
                    return this.fake;
            }
        }

        if (isARPEnabled()) {
            return this.arp;
        }
        return this.airdrop;
    }
}

export const airdropHistoryFactory = new AirdropHistoryFactory();
