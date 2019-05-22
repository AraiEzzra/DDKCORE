import config from 'shared/config';

export class VersionChecker {
    private splittedMinVersion: Array<string>;
    private validator: RegExp;

    constructor(minVersion: string) {
        this.validator = /^\d+\.\d+\.\d+$/;
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
            }
        }

        return true;
    }

    private validate(version: string): boolean {
        return this.validator.test(version);
    }
}

export default new VersionChecker(config.CORE.MIN_VERSION);
