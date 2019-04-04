import { BaseController } from 'core/controller/baseController';
import { PEERS_DISCOVER } from 'core/util/const';
import { ON } from 'core/util/decorator';
import SyncRepository from 'core/repository/sync';
import SyncService from 'core/service/sync';
import { Peer } from 'shared/model/peer';
import PeerRepository from 'core/repository/peer';
import { logger } from 'shared/util/logger';
import { shuffle } from 'shared/util/util';
import config from 'shared/config';

export class PeerController extends BaseController {

    @ON('EMIT_REQUEST_PEERS')
    async connectNewPeers(): Promise<void> {
        const response = await SyncRepository.requestPeers();
        SyncService.connectNewPeers(response.data);
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

        let shuffledPeers = shuffle([...discoveredPeers.values()]);
        if (discoveredPeers.size < PEERS_DISCOVER.MIN) {
            shuffledPeers = [...config.CORE.PEERS.TRUSTED];
        }
        const peers = shuffledPeers.slice(0, PEERS_DISCOVER.MAX);
        PeerRepository.connectPeers(peers);
    }
}

export default new PeerController();
