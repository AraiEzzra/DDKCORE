import { BaseController } from 'core/controller/baseController';
import { ON } from 'core/util/decorator';
import SyncService from 'core/service/sync';
import { logger } from 'shared/util/logger';
import { sortByKey } from 'shared/util/util';
import config from 'shared/config';
import { ActionTypes } from 'core/util/actionTypes';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import { PeerAddress } from 'shared/model/types';
import PeerService from 'core/service/peer';
import { PEER_SOCKET_TYPE } from 'core/driver/socket/socketsTypes';
import SystemRepository from 'core/repository/system';
import { SerializedFullHeaders } from 'shared/model/Peer/fullHeaders';
import { asyncTimeout } from 'shared/util/timer';

const RECONNECT_DELAY_MS = 900;

type ReceiveHeaders = {
    peerAddress: PeerAddress,
    peerHeaders: SerializedFullHeaders,
    socket,
    type: PEER_SOCKET_TYPE,
};

export class PeerController extends BaseController {

    @ON(ActionTypes.PEER_CONNECT_RUN)
    init() {
        PeerService.connectPeers(config.CORE.PEERS.TRUSTED);
    }

    @ON(ActionTypes.EMIT_REQUEST_PEERS)
    async discoverNewPeers(): Promise<void> {

        if (PeerNetworkRepository.count >= config.CONSTANTS.MAX_PEERS_CONNECT_TO) {
            return;
        }
        const discoveredPeers = await SyncService.discoverPeers();
        const filteredPeers = discoveredPeers.filter((peerAddress: PeerAddress & { peerCount: number }) => {
            return peerAddress.peerCount < config.CONSTANTS.MAX_PEERS_CONNECTED &&
                !PeerNetworkRepository.has(peerAddress) &&
                !PeerNetworkRepository.isBanned(peerAddress) &&
                config.CORE.PEERS.BLACKLIST.indexOf(peerAddress.ip) === -1;
        });
        const sortedPeers = filteredPeers.sort(sortByKey('peerCount', 'ASC'));
        logger.trace(`[Controller][Peer][discoverNewPeers] sortedPeers: ${JSON.stringify(sortedPeers)}`);

        const peers = sortedPeers.slice(0, config.CONSTANTS.MAX_PEERS_CONNECT_TO - PeerNetworkRepository.count);
        PeerService.connectPeers(peers);
    }

    @ON(ActionTypes.REQUEST_PEERS)
    sendPeers({ requestPeerInfo }): void {
        SyncService.sendPeers(requestPeerInfo);
    }

    @ON(ActionTypes.EMIT_REBOOT_PEERS_CONNECTIONS)
    async rebootPeersConnections(): Promise<void> {
        const discoveredPeers = await SyncService.discoverPeers();
        PeerNetworkRepository.clearBanList();
        PeerService.removeAll();
        logger.debug('[Controller][Peer][rebootPeersConnections]: DISCONNECTED ALL PEERS');

        const filteredPeers = [...discoveredPeers.values()].filter(
            (peer: PeerAddress & { peerCount: number }) => {
                return peer.peerCount <= config.CONSTANTS.MAX_PEERS_CONNECTED &&
                    config.CORE.PEERS.BLACKLIST.indexOf(peer.ip) === -1;
            }
        );

        let sortedPeers: Array<PeerAddress & { peerCount?: number }> = filteredPeers
            .sort(sortByKey('peerCount', 'ASC'));

        if (discoveredPeers.length <= config.CONSTANTS.PEERS_DISCOVER.MIN) {
            sortedPeers = [...config.CORE.PEERS.TRUSTED];
        }

        const peers = sortedPeers.slice(0, config.CONSTANTS.PEERS_DISCOVER.MAX);
        await asyncTimeout(RECONNECT_DELAY_MS);
        PeerService.connectPeers(peers);
    }

    @ON(ActionTypes.HEADERS_RECEIVE)
    headersReceive(data: ReceiveHeaders) {
        logger.debug(`[Controller][Peer][headersReceive] peer ${data.peerAddress.ip} connecting as ${data.type}`);
        const result = PeerService.add(data.peerAddress, data.peerHeaders, data.socket);
        if (result && data.type === PEER_SOCKET_TYPE.CLIENT) {
            const peer = PeerNetworkRepository.get(data.peerAddress);
            peer.sendFullHeaders(SystemRepository.getFullHeaders().serialize());

        }
    }

    @ON(ActionTypes.REMOVE_PEER)
    removePeer(peerAddress: PeerAddress) {
        PeerService.remove(peerAddress);
    }

}

export default new PeerController();
