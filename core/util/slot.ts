import SlotService from 'core/service/slot';
import config from 'shared/util/config';

export const isLastSlot = (timestamp: number): boolean => {
    if (timestamp === 0) {
        return true;
    }

    const slot = SlotService.getSlotNumber(timestamp);
    if (slot % config.constants.activeDelegates === 0) {
        return true;
    }

    return false;
};
