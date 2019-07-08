import config from 'shared/config';
import { IConstants } from 'shared/config/types';

class PeerPreparator {

    setCustomConstants = (customConstants: IConstants) => {
        Object.assign(config.CONSTANTS, customConstants);
        console.log(`[Preparator][setCustomConstants]`);
    };

    setTrustedPeers = (peers: Array<{ ip: string, port: number }>) => {
        config.CORE.PEERS.TRUSTED = peers;

        console.log(`[Preparator][setTrustedPeers]`);
    }

    setBlocks() {
        console.log(`[Preparator][setBlocks]`);
    }
}

export const preparePeerNode = (data: { customConfig?, trustedPeers? }) => {
    return async () => {
        const preparator = new PeerPreparator();

        if (data.customConfig) {
            preparator.setCustomConstants(data.customConfig);
        }

        if (data.trustedPeers) {
            preparator.setTrustedPeers(data.trustedPeers);
        }

    };
};
