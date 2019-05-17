import config from 'shared/config';
import { Timestamp } from 'shared/model/types';

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
    let slot = Math.trunc(timestamp / config.CONSTANTS.FORGING.SLOT_INTERVAL);
    // TODO: optimize it if possible
    while (slot % activeDelegatesLength !== activeDelegatesLength - 1) {
        slot -= 1;
    }

    return slot;
};
