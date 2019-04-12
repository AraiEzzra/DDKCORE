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
import { ResponseEntity } from 'shared/model/response';
import { SOCKET_RPC_REQUEST_TIMEOUT } from 'core/util/const';
import { CORE_SOCKET_CLIENT_CONFIG, API_SOCKET_SERVER_CONFIG } from 'shared/config/socket';

export const REQUEST_TIMEOUT = '408 Request Timeout';

const ioServer = socketIO(config.CORE.SOCKET.PORT, API_SOCKET_SERVER_CONFIG);

export const BROADCAST = 'BROADCAST';
export const SOCKET_RPC_REQUEST = 'SOCKET_RPC_REQUEST';
export const SOCKET_RPC_RESPONSE = 'SOCKET_RPC_RESPONSE';
export const SERVER_HEADERS = 'SERVER_HEADERS';
export const OPEN = 'OPEN';
export const HEADERS = 'HEADERS';

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
            setTimeout(() => {
                this.connectNewPeer(peer);
            }, Math.floor(Math.random() * 11 * 1000));
        });
        ioServer.on('connect', (socket) => {
            if (PeerRepository.peerList().length > config.CONSTANTS.MAX_PEERS_CONNECTED) {
                logger.debug(`[SOCKET][init] peer connection rejected, too many connections`);
                socket.disconnect(true);
                return;
            }

            socket.emit(OPEN);
            socket.on(HEADERS, (data: string) => {
                logger.debug(`[SOCKET][HEADERS_FROM_CLIENT]`);
                const peer = JSON.parse(data);
                if (Socket.instance.addPeer(peer, socket)) {
                    socket.emit(SERVER_HEADERS, JSON.stringify(
                        SystemRepository.getFullHeaders()
                    ));
                } else {
                    console.log(`disconnect ${JSON.stringify(data)}`);
                    socket.disconnect(true);
                }
            });
        });
        setTimeout(
            () => messageON('EMIT_REQUEST_PEERS'),
            config.CONSTANTS.TIMEOUT_START_PEER_REQUEST
        );
    }

    @autobind
    connectNewPeer(peer: { ip: string, port: number }): void {
        if (config.CORE.PEERS.BLACKLIST.includes(peer.ip) ||
            PeerRepository.has(peer) ||
            PeerRepository.peerList().length > config.CONSTANTS.MAX_PEERS_CONNECT_TO
        ) {
            return;
        }
        logger.debug(`[SOCKET][connectNewPeer] connecting to ${peer.ip}:${peer.port}...`);
        const ws = io(`ws://${peer.ip}:${peer.port}`, CORE_SOCKET_CLIENT_CONFIG);
        ws.on(OPEN, () => {
            logger.debug(`[SOCKET][connectNewPeer] connected to ${peer.ip}:${peer.port}`);

            ws.emit(HEADERS, JSON.stringify(SystemRepository.getFullHeaders()));
            ws.on(SERVER_HEADERS, (headers: string) => {
                logger.debug(`[SOCKET][HEADERS_FROM_SERVER]`);
                const fullPeer = Object.assign(JSON.parse(headers), peer);
                Socket.instance.addPeer(fullPeer, ws);
            });
        });
    }

    @autobind
    addPeer(peer: Peer, socket: SocketIOClient.Socket | SocketIO.Socket): boolean {
        if (PeerRepository.addPeer(peer, socket)) {
            logger.debug(`[SOCKET][ADD_PEER] host: ${peer.ip}:${peer.port}`);
            const listenBroadcast = (response: string) => Socket.instance.onPeerBroadcast(response, peer);
            const listenRPC = (response: string) => Socket.instance.onPeerRPCRequest(response, peer);
            socket.on(BROADCAST, listenBroadcast);
            socket.on(SOCKET_RPC_REQUEST, listenRPC);

            peer.socket.on('disconnect', (reason) => {
                logger.debug(`[SOCKET][DISCONNECT_REASON] ${reason}`);
                peer.socket.removeListener(BROADCAST, listenBroadcast);
                peer.socket.removeListener(SOCKET_RPC_REQUEST, listenRPC);
                PeerRepository.removePeer(peer);
            });
            return true;
        }
        return false;
    }

    @autobind
    onPeerBroadcast(response: string, peer: Peer): void {
        const { code, data } = new SocketResponse(response);
        logger.debug(`[SOCKET][ON_PEER_BROADCAST][${peer.ip}:${peer.port}], CODE: ${code}`);
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

        logger.debug(`[SOCKET][PEER_RPC_RESPONSE] to ${peer.ip}:${peer.port} CODE: ${code}, REQUEST_ID: ${requestId}`);

        peer.socket.emit(
            SOCKET_RPC_RESPONSE,
            JSON.stringify({ code, data, requestId })
        );
    }

    @autobind
    peerRPCRequest(code, data, peer): Promise<ResponseEntity<any>> {
        const requestId = uuid4();

        return new Promise((resolve) => {

            if (!(PeerRepository.has(peer))) {
                logger.error(`Peer ${peer.ip}:${peer.port} is offline`);
                resolve(new ResponseEntity({ errors: [`Peer ${peer.ip}:${peer.port} is offline`] }));
            }

            if (!peer.socket) {
                peer = PeerRepository.getPeerFromPool(peer);
            }

            const responseListener = (response) => {
                response = new SocketResponseRPC(response);
                if (response.requestId && response.requestId === requestId) {

                    clearTimeout(timerId);

                    logger.debug(`[SOCKET][SOCKET_RPC_RESPONSE] from ${peer.ip}:${peer.port}
                    CODE: ${response.code}, REQUEST_ID: ${response.requestId}, DATA: ${JSON.stringify(response.data)}`);

                    peer.socket.removeListener(SOCKET_RPC_RESPONSE, responseListener);

                    resolve(new ResponseEntity({ data: response.data }));
                }
            };

            const timerId = setTimeout(
                ((socket, res) => {
                    return () => {
                        socket.removeListener(SOCKET_RPC_RESPONSE, responseListener);
                        res(new ResponseEntity({ errors: [REQUEST_TIMEOUT] }));
                    };
                })(peer.socket, resolve),
                SOCKET_RPC_REQUEST_TIMEOUT
            );

            logger.debug(
                `[SOCKET][SOCKET_RPC_REQUEST] to ${peer.ip}:${peer.port} CODE: ${code}, REQUEST_ID: ${requestId}`
            );

            peer.socket.emit(
                SOCKET_RPC_REQUEST,
                JSON.stringify({ code, data, requestId })
            );

            peer.socket.on(SOCKET_RPC_RESPONSE, responseListener);
        });
    }
}

export default new Socket();
