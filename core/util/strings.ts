import config from 'shared/config';

const splittedMinVersion = config.CORE.MIN_VERSION.split('.');

export const isAcceptableVersion = (version: string) => {
    const splittedVersion = version.split('.');

    for (let index = 0; index < splittedMinVersion.length; index++) {
        if (splittedVersion[index] < splittedMinVersion[index]) {
            return false;
        }
    }

    return true;
};
