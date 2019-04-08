import { Round, Slot } from 'shared/model/round';

export const getLastSlotInRound = (round: Round): number =>
    Math.max(...(Object.values(round.slots).map((slot: Slot) => slot.slot)));
