import { expect } from 'chai';

import { checkSort } from 'core/util/sortChecker';

const compareFn = (a: number, b: number): number => {
    return a - b;
};

describe('Sort checker', () => {
    it('Positive with correct order', () => {
        const test = {
            data: [-10, -4, 0, 1, 5, 9, 19, 22, 45],
            expected: true,
        };

        const actual = checkSort(test.data, compareFn);

        expect(test.expected).equal(actual);
    });

    it('Positive with incorrect order', () => {
        const test = {
            data: [45, 4, 6, 1, -5, 3, 54, 12],
            expected: false,
        };

        const actual = checkSort(test.data, compareFn);

        expect(test.expected).equal(actual);
    });
});
