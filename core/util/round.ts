import { Round, Slot } from 'shared/model/round';

export const getLastSlotNumberInRound = (round: Round): number =>
    Math.max(...(Object.values(round.slots).map((slot: Slot) => slot.slot)));

export const compareRounds = (r1: Round, r2: Round): boolean => {
    let flag = true;
    if (Object.keys(r1).length !== Object.keys(r2).length) {
        return false;
    }

    for (let generatorPublicKey of Object.keys(r2.slots)) {
        if (
            !(generatorPublicKey in r1.slots) ||
            r2.slots[generatorPublicKey].slot !== r1.slots[generatorPublicKey].slot
        ) {
            flag = false;
            break;
        }
    }
    return flag;
};
