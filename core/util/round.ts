import config from 'shared/util/config';
import SlotService from 'core/service/slot';

export const calculateRoundFirstSlotByTimestamp = (timestamp: number): number => {
    return calculateRoundByTimestamp(timestamp) * config.constants.activeDelegates;
};

export const calculateRoundByTimestamp = (timestamp: number): number => {
    const slot = SlotService.getSlotNumber(timestamp);

    return calculateRound(slot, config.constants.activeDelegates);
};

export const calculateRound = (slot: number, activeDelegates: number): number => {
    return Math.ceil(slot / activeDelegates);
};
