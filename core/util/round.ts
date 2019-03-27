import config from 'shared/config';
import SlotService from 'core/service/slot';

// invalid method
export const calculateRoundFirstSlotByTimestamp = (timestamp: number): number => {
    return calculateRoundByTimestamp(timestamp) * config.CONSTANTS.ACTIVE_DELEGATES;
};

// invalid method
export const calculateRoundByTimestamp = (timestamp: number): number => {
    const slot = SlotService.getSlotNumber(timestamp);

    return calculateRound(slot, config.CONSTANTS.ACTIVE_DELEGATES);
};

// invalid method
export const calculateRound = (slot: number, activeDelegates: number): number => {
    return Math.ceil(slot / activeDelegates);
};
