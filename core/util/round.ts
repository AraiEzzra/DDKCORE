import { Round, Slot } from 'shared/model/round';

export const getLastSlotNumberInRound = (round: Round): number =>
    Math.max(...(Object.values(round.slots).map((slot: Slot) => slot.slot)));

export const isSlotNumberInRound = (round: Round, slotNumber: number): boolean => {
    return !!Object.values(round.slots).find(slot => slot.slot === slotNumber);
};
