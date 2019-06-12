import { expect } from 'chai';

import { VersionChecker, compareTags } from 'core/util/versionChecker';

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
            {
                version: '1.2.c',
                expected: false,
            },
            {
                version: '1.2',
                expected: false,
            },
            {
                version: '1.2.',
                expected: false,
            },
            {
                version: '1.2.3.4.5',
                expected: false,
            },
            {
                version: '...',
                expected: false,
            },
            {
                version: '3a2b11',
                expected: false,
            },
        ];

        tests.forEach(test => {
            const actual = versionChecker.isAcceptable(test.version);

            expect(test.expected).equal(actual, `version: ${test.version}`);
        });
    });

    it('Tags sorting', () => {
        const tags = [
            '3.4.743',
            '3.4.743',
            '1.4.143',
            '3.4.5',
            '3.4.5',
            '3.4.5',
            '3.4.4',
            '3.4.41',
            '0.0.1',
            '0.0.1',
            '0.0.0',
            '3.4.1',
            '3.4.1',
            '3.6.73',
        ];

        const sorted = tags.sort(compareTags);

        const expected = [
            '0.0.0',
            '0.0.1',
            '0.0.1',
            '1.4.143',
            '3.4.1',
            '3.4.1',
            '3.4.4',
            '3.4.5',
            '3.4.5',
            '3.4.5',
            '3.4.41',
            '3.4.743',
            '3.4.743',
            '3.6.73',
        ];

        expect(expected).to.eql(sorted);
    });
});
