import config from 'shared/config';
import { IConstants } from 'shared/config/types';
import BlockRepository from 'core/repository/block/index';
import { Block } from 'shared/model/block';

class PeerPreparator {

    setCustomConstants = (customConstants: IConstants) => {
        Object.assign(config.CONSTANTS, customConstants);
        console.log(`[Preparator][setCustomConstants]`);
    };

    setTrustedPeers = (peers: Array<{ ip: string, port: number }>) => {
        config.CORE.PEERS.TRUSTED = peers;

        console.log(`[Preparator][setTrustedPeers]`);
    };

    async setBlocks(blocks: Array<Block>) {
        for (const block of blocks) {
            BlockRepository.add(block);
        }
        console.log(`[Preparator][setBlocks]`);
    }
}

export const preparePeerNode = (data: { customConfig?, trustedPeers?, blocks? }) => {
    return async () => {
        const preparator = new PeerPreparator();

        if (data.customConfig) {
            preparator.setCustomConstants(data.customConfig);
        }

        if (data.trustedPeers) {
            preparator.setTrustedPeers(data.trustedPeers);
        }

        if (data.blocks) {
            preparator.setBlocks(data.blocks);
        }

    };
};
