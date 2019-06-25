import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import { NetworkPeer } from 'shared/model/Peer/networkPeer';
import SocketDriver from 'core/driver/socket/index';
import SystemRepository from 'core/repository/system';
import config from 'shared/config';
import { logger } from 'shared/util/logger';
import { PeerAddress, PeerHeadersReceived, RequestPeerInfo } from 'shared/model/types';
import { Headers } from 'shared/model/Peer/headers';
import { sortByKey } from 'shared/util/util';
import VersionChecker, { VersionChecker as PeerVersionChecker } from 'core/util/versionChecker';
import { isArray } from 'util';
import SwapTransactionQueue from 'core/service/swapTransactiontQueue';
import { messageON } from 'shared/util/bus';
import { ActionTypes } from 'core/util/actionTypes';
import { ResponseEntity } from 'shared/model/response';

const LOG_PREFIX = `[Service][Peer]`;
export const ERROR_NOT_ENOUGH_PEERS = 'ERROR_NOT_ENOUGH_PEERS';

export class PeerService {

    add(data: PeerHeadersReceived): boolean {
        if (config.CORE.PEERS.BLACKLIST.indexOf(data.peerAddress.ip) !== -1 ||
            !VersionChecker.isAcceptable(data.peerHeaders.version)) {
            logger.debug(`[Service][peer][add] invalid version ${data.peerHeaders.version}`);
            data.socket.disconnect(true);
            return false;
        }

        if (PeerMemoryRepository.has(data.peerAddress)) {
            return this.resolveConnectionConflict(data);
        } else {
            PeerMemoryRepository.add(data.peerAddress, data.peerHeaders, data.type);
            PeerNetworkRepository.add(data.peerAddress, data.socket);
        }
        return true;
    }

    resolveConnectionConflict(data: PeerHeadersReceived): boolean {

        logger.debug(`${LOG_PREFIX}[add] sockets conflict detected on ${data.peerAddress.ip}`);

        const networkPeer = PeerNetworkRepository.get(data.peerAddress);
        const ids = [data.socket, networkPeer].sort(sortByKey('id'));

        if (ids.indexOf(networkPeer) === 0) {
            logger.debug(`${LOG_PREFIX}[add] destroy new connection on ${data.peerAddress.ip}, id ${data.socket.id}`);
            data.socket.disconnect(true);
            return false;
        } else {
            logger.debug(`${LOG_PREFIX}[add] delete old connection ${networkPeer.id}, create new peer ` +
                `${data.peerAddress.ip}`);
            this.remove(data.peerAddress);
            PeerMemoryRepository.add(data.peerAddress, data.peerHeaders, data.type);
            PeerNetworkRepository.add(data.peerAddress, data.socket);
            return true;
        }
    }

    remove(peerAddress: PeerAddress) {
        logger.debug(`${LOG_PREFIX}[remove] ${peerAddress.ip}:${peerAddress.port}`);
        PeerMemoryRepository.remove(peerAddress);
        PeerNetworkRepository.remove(peerAddress);
        if (PeerMemoryRepository.count < config.CONSTANTS.PEERS_DISCOVER.MIN) {
            messageON(ActionTypes.EMIT_REQUEST_PEERS);
        }
    }

    removeAll() {
        PeerMemoryRepository.removeAll();
        PeerNetworkRepository.removeAll();
    }

    broadcast(code: string, data: any, peerAddresses?: Array<PeerAddress>, checkQueue: boolean = true): void {
        if (checkQueue && SwapTransactionQueue.size && PeerNetworkRepository.count) {
            SwapTransactionQueue.process();
        }

        let peers: Array<NetworkPeer> = [];
        if (peerAddresses && isArray(peerAddresses)) {
            peers = PeerNetworkRepository.getManyByAddress(peerAddresses);
        } else {
            peers = PeerNetworkRepository.getAll();
        }
        logger.trace(`${LOG_PREFIX}[broadcast]: code ${code} data ${JSON.stringify(data)}`);
        peers.forEach((peer: NetworkPeer) => peer.send(code, data));
    }

    update(peerAddress: PeerAddress, headers: Headers): void {
        if (!PeerMemoryRepository.has(peerAddress)) {
            logger.debug(`[${LOG_PREFIX}][update] peer does not found ${peerAddress.ip}`);
            return;
        }
        const peer = PeerMemoryRepository.get(peerAddress);
        peer.update(headers);
        if (PeerNetworkRepository.isBanned(peerAddress)) {
            if (headers.height === SystemRepository.headers.height &&
                headers.broadhash === SystemRepository.headers.broadhash
            ) {
                PeerNetworkRepository.unban(peerAddress);
            }
        }
    }

    connectPeers(peerList: Array<PeerAddress>) {

        const headers = SystemRepository.getFullHeaders();
        peerList.forEach((peerAddress: PeerAddress) => {
            if (!PeerMemoryRepository.has(peerAddress)) {
                SocketDriver.connectPeer(peerAddress, headers.serialize());
            }
        });
    }

    ping() {
        PeerNetworkRepository.getAll().forEach((peer: NetworkPeer) => {
            logger.trace(`[Service][Peer][ping] ${peer.peerAddress.ip}`);

            peer.requestRPC(ActionTypes.PING, {})
                .then((response: ResponseEntity<{}>) => {
                    if (!response.success) {
                        logger.debug(`[Service][Peer][ping] pong was failed ${peer.peerAddress.ip}`);
                        messageON(ActionTypes.REMOVE_PEER, peer.peerAddress);
                    }
                });
        });
    }

    pong(requestPeerInfo: RequestPeerInfo): void {
        if (!PeerNetworkRepository.has(requestPeerInfo.peerAddress)) {
            logger.trace(`[Service][Peer][pong] peer is offline for response ${requestPeerInfo.peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(requestPeerInfo.peerAddress);
        networkPeer.responseRPC(ActionTypes.PONG, {}, requestPeerInfo.requestId);
    }

}

export default new PeerService();
