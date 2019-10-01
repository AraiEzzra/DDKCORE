import { BaseController } from 'core/controller/baseController';
import { ON } from 'core/util/decorator';
import SyncService from 'core/service/sync';
import { logger } from 'shared/util/logger';
import { sortByKey } from 'shared/util/util';
import config from 'shared/config';
import { ActionTypes } from 'core/util/actionTypes';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import { PeerAddress, PeerHeadersReceived } from 'shared/model/types';
import PeerService from 'core/service/peer';
import { PEER_SOCKET_TYPE } from 'shared/model/types';
import SystemRepository from 'core/repository/system';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import { diffArrayPeers } from 'core/util/peer';

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

        const pickedPeers = await SyncService.pickNewPeers();
        const filteredPeers = PeerService.filterPeers(pickedPeers);

        const newUniquePeers = diffArrayPeers(filteredPeers, PeerMemoryRepository.getPeerAddresses());
        const sortedPeers = newUniquePeers.sort(sortByKey('peerCount', 'ASC'));

        const peers = sortedPeers.slice(0, config.CONSTANTS.MAX_PEERS_CONNECT_TO - PeerNetworkRepository.count);
        PeerService.connectPeers(peers);
    }

    @ON(ActionTypes.REQUEST_PEERS)
    sendPeers({ requestPeerInfo }): void {
        SyncService.sendPeers(requestPeerInfo);
    }

    @ON(ActionTypes.EMIT_REBOOT_PEERS_CONNECTIONS)
    async rebootPeersConnections(): Promise<void> {
        const pickedPeers = await SyncService.pickNewPeers();

        PeerNetworkRepository.clearBanList();

        const filteredPeers = PeerService.filterPeers(pickedPeers);
        const currentPeers = PeerMemoryRepository.getPeerAddresses();

        let sortedPeers: Array<PeerAddress & { peerCount?: number }> = filteredPeers
            .sort(sortByKey('peerCount', 'ASC'));

        if (filteredPeers.length <= config.CONSTANTS.PEERS_DISCOVER.MIN) {
            sortedPeers = [...config.CORE.PEERS.TRUSTED];
        }

        const newPeers = sortedPeers.slice(0, config.CONSTANTS.PEERS_DISCOVER.MAX);

        PeerService.stepReconnect(currentPeers, newPeers);
    }

    @ON(ActionTypes.HEADERS_RECEIVE)
    headersReceive(data: PeerHeadersReceived) {
        logger.debug(`[Controller][Peer][headersReceive] peer ${data.peerAddress.ip} connecting as ${data.type}`);
        const result = PeerService.add(data);
        if (result && data.type === PEER_SOCKET_TYPE.CLIENT) {
            const peer = PeerNetworkRepository.get(data.peerAddress);
            peer.sendFullHeaders(SystemRepository.getFullHeaders().serialize());

        }
    }

    @ON(ActionTypes.EMIT_PING)
    ping(): void {
        PeerService.ping();
    }

    @ON(ActionTypes.PING)
    pong({ requestPeerInfo }): void {
        PeerService.pong(requestPeerInfo);
    }

    @ON(ActionTypes.REMOVE_PEER)
    removePeer(peerAddress: PeerAddress) {
        PeerService.remove(peerAddress);
    }

    @ON(ActionTypes.REMOVE_ALL_PEERS)
    removeAll() {
        PeerService.removeAll();
    }

}

export default new PeerController();
