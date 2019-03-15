import autobind from 'autobind-decorator';
import io from 'socket.io-client';
import socketIO from 'socket.io';

import SystemRepository from 'core/repository/system';
import { Peer } from 'shared/model/peer';
import { messageON } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import PeerRepository, { BLACK_LIST, TRUSTED_PEERS } from 'core/repository/peer';
import config from 'shared/util/config';

const ioServer = socketIO(config.constants.serverPort, {
    serveClient: false,
    pingTimeout: 30000,
    pingInterval: 30000,
});
const START_PEER_REQUEST = 10000;

export class Socket {
    private static instance: Socket;

    constructor() {
        if (Socket.instance) {
            return Socket.instance;
        }
        Socket.instance = this;
        logger.debug('SOCKET CONSTRUCTOR', JSON.stringify(TRUSTED_PEERS));
    }

    init(): void {
        logger.debug(`SOCKET_START ${config.constants.serverHost}:${config.constants.serverPort}`);
        TRUSTED_PEERS.forEach((peer: any) => {
            this.connectNewPeer(peer);
        });
        ioServer.on('connect', function (socket) {
            socket.emit('OPEN');
            socket.on('HEADERS', (data: string) => {
                logger.debug(`[SOCKET][CLIENT_PEER_HEADERS_RECEIVE], data: ${data}`);
                const peer = JSON.parse(data);
                if (Socket.instance.addPeer(peer, socket)) {
                    socket.emit('SERVER_HEADERS', JSON.stringify(
                        SystemRepository.getFullHeaders()
                    ));
                }
            });
        });
        setTimeout(
            () => messageON('EMIT_REQUEST_PEERS', {}),
            START_PEER_REQUEST
        );
    }

    @autobind
    connectNewPeer(peer: Peer): void {
        if (BLACK_LIST.has(`${peer.ip}`) ||
            PeerRepository.has(peer)) {
            return;
        }

        const ws = io(`ws://${peer.ip}:${peer.port}`);
        ws.on('OPEN', () => {
            ws.emit('HEADERS', JSON.stringify(
                SystemRepository.getFullHeaders()
            ));
            ws.on('SERVER_HEADERS', (headers: string) => {
                logger.debug(`[SOCKET][SERVER_PEER_HEADERS_RECEIVE] data: ${headers}`);
                const fullPeer = Object.assign(JSON.parse(headers), peer);
                Socket.instance.addPeer(fullPeer, ws);
            });
        });
    }

    @autobind
    addPeer(peer: Peer, socket): boolean {
        if (PeerRepository.addPeer(peer, socket)) {
            logger.debug(`[SOCKET][ADD_PEER] host: ${peer.ip}:${peer.port}`);
            socket.on('ACTION', (response: string) => Socket.instance.onPeerAction(response, peer));

            peer.socket.on('disconnect', () => {
                PeerRepository.removePeer(peer);
            });
            return true;
        }
        return false;
    }

    @autobind
    onPeerAction(response: string, peer: Peer): void {
        const { code, data } = JSON.parse(response);
        logger.debug(`[SOCKET][ON_PEER_ACTION][${peer.ip}:${peer.port}], CODE: ${code}, DATA: ${JSON.stringify(data)}`);
        messageON(code, { data, peer });
    }

    @autobind
    emitPeers(code, data, peers: Array<Peer> = null): void {
        (peers || PeerRepository.peerList()).forEach(peer => {
            this.emitPeer(code, data, peer);
        });
    }

    @autobind
    emitPeer(code, data, peer): void {
        if (!(PeerRepository.has(peer))) {
            logger.error(`Peer ${peer.ip}:${peer.port} is offline`);
            return;
        }
        if (!peer.socket) {
            peer = PeerRepository.getPeerFromPool(peer);
        }
        peer.socket.emit(
            'ACTION',
            JSON.stringify({ code, data })
        );
    }
}

export default new Socket();
