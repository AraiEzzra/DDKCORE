import config from 'shared/util/config';
import SlotService from 'core/service/slot';

export const calculateRoundByTimestamp = (timestamp: number): number => {
    const slot = SlotService.getSlotNumber(timestamp);

    return Math.ceil(slot - 1 / config.constants.activeDelegates);
};
