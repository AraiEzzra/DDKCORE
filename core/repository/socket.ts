import autobind from 'autobind-decorator';
import io from 'socket.io-client';
import socketIO from 'socket.io';
import uuid4 from 'uuid/v4';
import SystemRepository from 'core/repository/system';
import { Peer } from 'shared/model/peer';
import { messageON } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import PeerRepository from 'core/repository/peer';
import config from 'shared/config';
import { SocketResponse, SocketResponseRPC } from 'shared/model/socket';
import {
    START_PEER_REQUEST,
    SOCKET_RPC_REQUEST_TIMEOUT,
    MAX_PEERS_CONNECT_TO,
    MAX_PEERS_CONNECTED
} from 'core/util/const';
import { ResponseEntity } from 'shared/model/response';

export const REQUEST_TIMEOUT = '408 Request Timeout';

const ioServer = socketIO(config.CORE.SOCKET.PORT, {
    serveClient: false,
    pingTimeout: 10000,
    pingInterval: 10000,
});

export class Socket {
    private static instance: Socket;

    constructor() {
        if (Socket.instance) {
            return Socket.instance;
        }
        Socket.instance = this;
        logger.debug('SOCKET CONSTRUCTOR', JSON.stringify(config.CORE.PEERS.TRUSTED));
    }

    init(): void {
        logger.debug(`WebSocket listening on port ${config.CORE.SOCKET.PORT}`);
        config.CORE.PEERS.TRUSTED.forEach((peer) => {
            this.connectNewPeer(peer);
        });
        ioServer.on('connect', function (socket) {
            if (PeerRepository.peerList().length > MAX_PEERS_CONNECTED) {
                logger.debug(`[SOCKET][init] peer connection rejected, too many connections`);
                socket.disconnect();
                return;
            }
            socket.emit('OPEN');
            socket.on('HEADERS', (data: string) => {
                logger.debug(`[SOCKET][HEADERS_FROM_CLIENT]`);
                const peer = JSON.parse(data);
                if (Socket.instance.addPeer(peer, socket)) {
                    socket.emit('SERVER_HEADERS', JSON.stringify(
                        SystemRepository.getFullHeaders()
                    ));
                } else {
                    socket.disconnect();
                }
            });
        });
        setTimeout(
            () => messageON('EMIT_REQUEST_PEERS', {}),
            START_PEER_REQUEST
        );
    }

    @autobind
    connectNewPeer(peer: { ip: string, port: number }): void {
        if (config.CORE.PEERS.BLACKLIST.includes(peer.ip) ||
            PeerRepository.has(peer) ||
            PeerRepository.peerList().length > MAX_PEERS_CONNECT_TO
        ) {
            return;
        }
        logger.debug(`[SOCKET][connectNewPeer] connecting to ${peer.ip}:${peer.port}...`);
        const ws = io(`ws://${peer.ip}:${peer.port}`);
        ws.on('OPEN', () => {
            ws.emit('HEADERS', JSON.stringify(
                SystemRepository.getFullHeaders()
            ));
            ws.on('SERVER_HEADERS', (headers: string) => {
                logger.debug(`[SOCKET][HEADERS_FROM_SERVER]`);
                const fullPeer = Object.assign(JSON.parse(headers), peer);
                Socket.instance.addPeer(fullPeer, ws);
            });
        });
    }

    @autobind
    addPeer(peer: Peer, socket): boolean {
        if (PeerRepository.addPeer(peer, socket)) {
            logger.debug(`[SOCKET][ADD_PEER] host: ${peer.ip}:${peer.port}`);
            const listenBroadcast = (response: string) => Socket.instance.onPeerBroadcast(response, peer);
            const listenRPC = (response: string) => Socket.instance.onPeerRPCRequest(response, peer);
            socket.on('BROADCAST', listenBroadcast);
            socket.on('SOCKET_RPC_REQUEST', listenRPC);

            peer.socket.on('disconnect', (reason) => {
                logger.debug(`REASON ${reason}`);
                peer.socket.removeListener('BROADCAST', listenBroadcast);
                peer.socket.removeListener('SOCKET_RPC_REQUEST', listenRPC);
                PeerRepository.removePeer(peer);
            });
            return true;
        }
        return false;
    }

    @autobind
    onPeerBroadcast(response: string, peer: Peer): void {
        const { code, data } = new SocketResponse(response);
        logger.debug(
            `[SOCKET][ON_PEER_BROADCAST][${peer.ip}:${peer.port}], CODE: ${code}, DATA: ${JSON.stringify(data)}`
        );
        messageON(code, { data, peer });
    }

    @autobind
    onPeerRPCRequest(response: string, peer: Peer): void {
        const { code, data, requestId } = new SocketResponseRPC(response);
        logger.debug(`[SOCKET][ON_PEER_RPC_REQUEST] from ${peer.ip}:${peer.port}
          CODE: ${code}, REQUEST_ID: ${requestId} DATA: ${JSON.stringify(data)}`);
        messageON(code, { data, peer, requestId });
    }

    @autobind
    broadcastPeers(code, data, peers: Array<Peer> = null): void {
        (peers || PeerRepository.peerList()).forEach(peer => {
            this.broadcastPeer(code, data, peer);
        });
    }

    @autobind
    broadcastPeer(code, data, peer): void {
        if (!(PeerRepository.has(peer))) {
            logger.error(`Peer ${peer.ip}:${peer.port} is offline`);
            return;
        }

        if (!peer.socket) {
            peer = PeerRepository.getPeerFromPool(peer);
        }

        peer.socket.emit(
            'BROADCAST',
            JSON.stringify({ code, data })
        );
    }

    @autobind
    peerRPCResponse(code, data, peer, requestId): void {
        if (!(PeerRepository.has(peer))) {
            logger.error(`Peer ${peer.ip}:${peer.port} is offline`);
            return;
        }

        if (!peer.socket) {
            peer = PeerRepository.getPeerFromPool(peer);
        }

        logger.debug(`[SOCKET][PEER_RPC_RESPONSE] to ${peer.ip}:${peer.port}
          CODE: ${code}, REQUEST_ID: ${requestId} DATA: ${JSON.stringify(data)}`);

        peer.socket.emit(
            'SOCKET_RPC_RESPONSE',
            JSON.stringify({ code, data, requestId })
        );
    }

    @autobind
    peerRPCRequest(code, data, peer): Promise<ResponseEntity<any>> {
        const requestId = uuid4();

        return new Promise((resolve) => {

            const responseListener = (response) => {
                response = new SocketResponseRPC(response);
                if (response.requestId && response.requestId === requestId) {

                    clearTimeout(timerId);

                    logger.debug(`[SOCKET][SOCKET_RPC_RESPONSE] from ${peer.ip}:${peer.port}
                    CODE: ${response.code}, REQUEST_ID: ${response.requestId}, DATA: ${JSON.stringify(response.data)}`);

                    peer.socket.removeListener('SOCKET_RPC_RESPONSE', responseListener);

                    resolve(new ResponseEntity({ data: response.data }));
                }
            };

            if (!(PeerRepository.has(peer))) {
                logger.error(`Peer ${peer.ip}:${peer.port} is offline`);
                resolve(new ResponseEntity({ errors: [`Peer ${peer.ip}:${peer.port} is offline`] }));
            }

            if (!peer.socket) {
                peer = PeerRepository.getPeerFromPool(peer);
            }

            const timerId = setTimeout(
                () => {
                    resolve(new ResponseEntity({ errors: [REQUEST_TIMEOUT] }));
                },
                SOCKET_RPC_REQUEST_TIMEOUT
            );

            logger.debug(`[SOCKET][SOCKET_RPC_REQUEST] to ${peer.ip}:${peer.port}
            CODE: ${code}, REQUEST_ID: ${requestId} DATA: ${JSON.stringify(data)}`);

            peer.socket.emit(
                'SOCKET_RPC_REQUEST',
                JSON.stringify({ code, data, requestId })
            );

            peer.socket.on('SOCKET_RPC_RESPONSE', responseListener);
        });
    }
}

export default new Socket();
