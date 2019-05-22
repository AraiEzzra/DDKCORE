import { expect } from 'chai';
import { getFirstSlotNumberInRound } from 'core/util/slot';

const ACTIVE_DELEGATES = 3;

describe('Slot utils', () => {
    it('First slot number in round calculation', () => {
        const timestamp = 100;
        const slotNumber = getFirstSlotNumberInRound(timestamp, ACTIVE_DELEGATES);
        const expected = 8;

        expect(slotNumber).equal(expected);
    });
});
