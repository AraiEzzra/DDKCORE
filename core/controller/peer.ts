import { BaseController } from 'core/controller/baseController';
import { ON } from 'core/util/decorator';
import SyncRepository from 'core/repository/sync';
import SyncService from 'core/service/sync';
import { Peer } from 'shared/model/peer';
import PeerRepository from 'core/repository/peer';
import { logger } from 'shared/util/logger';
import { shuffle } from 'shared/util/util';
import config from 'shared/config';
import System from 'core/repository/system';

export class PeerController extends BaseController {

    @ON('EMIT_REQUEST_PEERS')
    async connectNewPeers(): Promise<void> {

        if (System.peerCount >= config.CONSTANTS.MAX_PEERS_CONNECT_TO) {
            return;
        }
        const discoveredPeers = await SyncRepository.discoverPeers();
        const filteredPeers = [...discoveredPeers.values()].filter((peer: Peer) => {
            return peer.peerCount < config.CONSTANTS.MAX_PEERS_CONNECTED &&
                config.CORE.PEERS.BLACKLIST.indexOf(peer.ip) === -1;
        });
        const shuffledPeers = shuffle(filteredPeers);
        const peers = shuffledPeers.slice(0, config.CONSTANTS.MAX_PEERS_CONNECT_TO - System.peerCount);
        PeerRepository.connectPeers(peers);
    }

    @ON('REQUEST_PEERS')
    sendPeers(action: { peer: Peer, requestId: string }): void {
        const { peer, requestId } = action;
        SyncService.sendPeers(peer, requestId);
    }

    @ON('EMIT_REBOOT_PEERS_CONNECTIONS')
    async rebootPeersConnections(): Promise<void> {
        const discoveredPeers = await SyncRepository.discoverPeers();
        PeerRepository.disconnectPeers();
        logger.debug('[Controller][Peer][rebootPeersConnections]: DISCONNECTED ALL PEERS');

        const filteredPeers = [...discoveredPeers.values()].filter((peer: Peer) => {
            return peer.peerCount <= config.CONSTANTS.MAX_PEERS_CONNECTED &&
                config.CORE.PEERS.BLACKLIST.indexOf(peer.ip) === -1;
        });
        let shuffledPeers = shuffle(filteredPeers);
        if (discoveredPeers.size <= config.CONSTANTS.PEERS_DISCOVER.MIN) {
            shuffledPeers = [...config.CORE.PEERS.TRUSTED];
        }
        const peers = shuffledPeers.slice(0, config.CONSTANTS.PEERS_DISCOVER.MAX);
        PeerRepository.connectPeers(peers);
    }
}

export default new PeerController();
