import config from 'shared/config';
import { Timestamp } from 'shared/model/account';

export const sortHashListFunc = (a, b) => {
    if (a.hash > b.hash) {
        return 1;
    }
    if (a.hash < b.hash) {
        return -1;
    }
    return 0;
};

export const getFirstSlotNumberInRound = (timestamp: Timestamp, activeDelegatesLength: number) => {
    let slot = timestamp / config.CONSTANTS.FORGING.SLOT_INTERVAL;
    while (slot % activeDelegatesLength === activeDelegatesLength - 1) {
        slot -= config.CONSTANTS.FORGING.SLOT_INTERVAL;
    }
    return slot;
};
