import { expect } from 'chai';

import { VersionChecker } from 'core/util/versionChecker';

describe('Version checker', () => {
    it('Is acceptable', () => {
        const versionChecker = new VersionChecker('2.4.43');

        const tests: Array<{ version: string, expected: boolean }> = [
            {
                version: '3.4.743',
                expected: true,
            },
            {
                version: '2.4.743',
                expected: true,
            },
            {
                version: '2.4.243',
                expected: true,
            },
            {
                version: '2.4.43',
                expected: true,
            },
            {
                version: '2.4.42',
                expected: false,
            },
            {
                version: '0.0.0',
                expected: false,
            },
        ];

        tests.forEach(test => {
            const actual = versionChecker.isAcceptable(test.version);

            expect(test.expected).equal(actual, `version: ${test.version}`);
        });
    });
});
