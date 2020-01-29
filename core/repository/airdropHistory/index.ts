import AirdropHistoryRepository from 'core/repository/airdropHistory/AirdropHistoryRepository';
import ARPHistoryRepository from 'core/repository/airdropHistory/ARPHistoryRepository';
import AirdropHistoryFakeRepository from 'core/repository/airdropHistory/AirdropHistoryFakeRepository';
import {
    AirdropHistory, AirdropDailyHistoryQuery, AirdropHistoryQuery, IAirdropHistoryRepository
} from 'shared/repository/airdropHistory/interfaces';
import { AirdropType } from 'shared/model/airdrop';
import config from 'shared/config';
import { isARPEnabled } from 'core/util/feature';

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
        this.arp = new ARPHistoryRepository();
    }

    get(type?: AirdropType): IAirdropHistoryRepository {
        if (type) {
            // tslint:disable-next-line: switch-default
            switch (type) {
                case AirdropType.AIRDROP:
                    return this.airdrop;
                case AirdropType.ARP:
                    return this.arp;
            }
        }

        if (isARPEnabled()) {
            return this.arp;
        }
        if (config.CORE.IS_REFERRED_USERS_ENABLED) {
            return this.airdrop;
        }
        return this.fake;
    }
}

export const airdropHistoryFactory = new AirdropHistoryFactory();
