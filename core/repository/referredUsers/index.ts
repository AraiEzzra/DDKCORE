import AirdropReferredUsersTree from 'core/repository/referredUsers/tree/AirdropReferredUsersTree';
import ARPReferredUsersTree from 'core/repository/referredUsers/tree/ARPReferredUsersTree';
import { airdropHistoryFactory } from 'core/repository/airdropHistory';
import ReferredUsersFake from 'core/repository/referredUsers/ReferredUsersFake';
import ReferredUserSerializable from 'core/repository/referredUsers/utils/ReferredUserSerializable';
import { ReferredUserFactor, IReferredUsers, FactorAction } from 'core/repository/referredUsers/interfaces';
import config from 'shared/config';
import { isARPEnabled } from 'core/util/feature';
import { AirdropType } from 'shared/model/airdrop';

export const referredUserSerializable = new ReferredUserSerializable();

export {
    FactorAction,
    ReferredUserFactor
};

class ReferredUsersFactory {
    private readonly fake: IReferredUsers;
    private readonly airdrop: IReferredUsers;
    private readonly arp: IReferredUsers;

    constructor() {
        this.fake = new ReferredUsersFake();
        this.airdrop = new AirdropReferredUsersTree(airdropHistoryFactory.get(AirdropType.AIRDROP));
        this.arp = new ARPReferredUsersTree(airdropHistoryFactory.get(AirdropType.ARP));
    }

    get(type?: AirdropType): IReferredUsers {
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

export const referredUsersFactory = new ReferredUsersFactory();
