import config from 'shared/config';

export class VersionChecker {
    private splittedMinVersion: Array<string>;

    constructor(minVersion: string) {
        this.splittedMinVersion = minVersion.split('.');
    }

    public isAcceptable(version: string): boolean {
        const splittedVersion = version.split('.');

        for (let index = 0; index < this.splittedMinVersion.length; index++) {
            if (Number(splittedVersion[index]) < Number(this.splittedMinVersion[index])) {
                return false;
            }
        }

        return true;
    }
}

export default new VersionChecker(config.CORE.MIN_VERSION);
