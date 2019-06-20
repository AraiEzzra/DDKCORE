import config from 'shared/config';

const tagValidator = /^\d+\.\d+\.\d+$/;

export class VersionChecker {
    private splittedMinVersion: Array<string>;
    private validator: RegExp;

    constructor(minVersion: string) {
        this.validator = tagValidator;
        this.splittedMinVersion = minVersion.split('.');
    }

    public isAcceptable(version: string): boolean {
        if (!this.validate(version)) {
            return false;
        }

        const splittedVersion = version.split('.');

        for (let index = 0; index < this.splittedMinVersion.length; index++) {
            if (Number(splittedVersion[index]) < Number(this.splittedMinVersion[index])) {
                return false;
            } else if (Number(splittedVersion[index]) > Number(this.splittedMinVersion[index])) {
                return true;
            }
        }

        return true;
    }

    private validate(version: string): boolean {
        return this.validator.test(version);
    }
}

export const compareTags = (a: string, b: string): number => {
    if (!tagValidator.test(a) || !tagValidator.test(b)) {
        return 0;
    }

    const splittedA = a.split('.');
    const splittedB = b.split('.');

    for (let index = 0; index < splittedA.length; index++) {
        const elementA = Number(splittedA[index]);
        const elementB = Number(splittedB[index]);

        if (elementA > elementB) {
            return 1;
        }
        if (elementA < elementB) {
            return -1;
        }
    }

    return 0;
};

export default new VersionChecker(config.CORE.MIN_VERSION);
