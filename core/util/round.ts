import { Round } from 'shared/model/round';

export const getLastSlotInRound = (round: Round): number => Math.max(...Object.values(round.slots));
export const getFirstSlotInRound = (round: Round): number => Math.min(...Object.values(round.slots));
