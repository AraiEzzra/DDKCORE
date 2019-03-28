import { BaseController } from 'core/controller/baseController';
import { PEERS_DISCOVER } from 'core/util/const';
import { ON } from 'core/util/decorator';
import SyncRepository from 'core/repository/sync';
import SyncService from 'core/service/sync';
import { Peer } from 'shared/model/peer';
import PeerRepository from 'core/repository/peer';
import { logger } from 'shared/util/logger';
import { shuffle } from 'shared/util/util';

export class PeerController extends BaseController {

    @ON('EMIT_REQUEST_PEERS')
    async connectNewPeers(): Promise<void> {
        const peers = await SyncRepository.requestPeers();
        SyncService.connectNewPeers(peers);
    }

    @ON('REQUEST_PEERS')
    sendPeers(action: { peer: Peer, requestId: string }): void {
        const { peer, requestId } = action;
        SyncService.sendPeers(peer, requestId);
    }

    @ON('EMIT_REBOOT_PEERS_CONNECTIONS')
    async rebootPeersConnections(): Promise<void> {
        const discoveredPeers = await SyncRepository.discoverPeers();
        if (discoveredPeers.size < PEERS_DISCOVER.MIN) {
            return;
        }

        PeerRepository.disconnectPeers();
        logger.debug('[Controller][Peer][rebootPeersConnections]: DISCONNECTED ALL PEERS');

        const shuffledPeers = shuffle([...discoveredPeers.values()]);
        const peers = shuffledPeers.slice(0, PEERS_DISCOVER.MAX);
        logger.debug(`[Controller][Peer][rebootPeersConnections]: DISCOVERED PEERS ${JSON.stringify(peers)}`);
        PeerRepository.connectPeers(peers);
    }
}

export default new PeerController();
