import io from 'socket.io-client';
import socketIO from 'socket.io';
import config, { DEFAULT_CORE_SOCKET_PORT } from 'shared/config/index';
import { API_SOCKET_SERVER_CONFIG, CORE_SOCKET_CLIENT_CONFIG } from 'shared/config/socket';
import { messageON } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import { IPRegExp } from 'core/util/common';
import { PeerAddress } from 'shared/model/types';
import { ActionTypes } from 'core/util/actionTypes';
import { SerializedFullHeaders } from 'shared/model/Peer/fullHeaders';
import { PEER_SOCKET_EVENTS, PEER_SOCKET_TYPE } from 'core/driver/socket/socketsTypes';

export const REQUEST_TIMEOUT = '408 Request Timeout';
export class Index {
    private static instance: Index;
    private static ioServer;

    constructor() {
        if (Index.instance) {
            return Index.instance;
        }
        Index.instance = this;
    }

    initServer(): void {
        Index.ioServer = socketIO(config.CORE.SOCKET.PORT, API_SOCKET_SERVER_CONFIG);

        logger.debug(`WebSocket listening on port ${config.CORE.SOCKET.PORT}`);

        Index.ioServer.on(PEER_SOCKET_EVENTS.CONNECT, Index.instance.onServerConnect);

        setTimeout(() => messageON(ActionTypes.PEER_CONNECT_RUN),
            config.CONSTANTS.TIMEOUT_START_PEER_CONNECT);

        setTimeout(() => messageON(ActionTypes.EMIT_REQUEST_PEERS),
            config.CONSTANTS.TIMEOUT_START_PEER_REQUEST
        );
    }

    onServerConnect(socket: socketIO.Socket): void {

        if (!socket.handshake.address) {
            logger.warn(`[SOCKET][onServerConnect] socket handshake address is missing`);
            socket.disconnect(true);
            return;
        }

        const ip = socket.handshake.address.match(IPRegExp).toString();

        if (config.CORE.PEERS.BLACKLIST.indexOf(ip) !== -1) {
            logger.warn(`[SOCKET][onServerConnect] trying to connect from black ip`);
            socket.disconnect(true);
        }

        if (Index.ioServer.clients().length > config.CONSTANTS.MAX_PEERS_CONNECTED) {
            logger.warn(`[SOCKET][onServerConnect] too many connections, sorry ${ip}`);
            socket.disconnect(true);
        }

        socket.on(PEER_SOCKET_EVENTS.HEADERS, (response) => {
                Index.instance.onHeadersReceive(
                    response, {
                        ip: ip,
                        port: DEFAULT_CORE_SOCKET_PORT
                    },
                    socket, PEER_SOCKET_TYPE.CLIENT);
            }
        );
    }

    connectPeer(peerAddress: PeerAddress, headers: SerializedFullHeaders): void {

        logger.debug(`[SOCKET][connectPeer] connecting to ${peerAddress.ip}:${peerAddress.port}...`);
        const ws: SocketIOClient.Socket = io(`ws://${peerAddress.ip}:${peerAddress.port}`, CORE_SOCKET_CLIENT_CONFIG);

        ws.on(PEER_SOCKET_EVENTS.CONNECT, () => {

            logger.debug(`[SOCKET][connectPeer] connected to ${peerAddress.ip}:${peerAddress.port}`);

            ws.emit(PEER_SOCKET_EVENTS.HEADERS, JSON.stringify(headers));
            ws.on(PEER_SOCKET_EVENTS.HEADERS, (response: string) => {
                Index.instance.onHeadersReceive(response, peerAddress, ws, PEER_SOCKET_TYPE.SERVER);
            });
        });
    }

    onHeadersReceive(response: string, peerAddress: PeerAddress, socket, type: PEER_SOCKET_TYPE) {
        const peerHeaders = JSON.parse(response);
        logger.debug(`HEADERS FROM ${type} ${peerAddress.ip}, broadhash: ${peerHeaders.broadhash}, ` +
            `height: ${peerHeaders.height}`);

        messageON(ActionTypes.HEADERS_RECEIVE, {
            peerAddress,
            peerHeaders,
            socket,
            type: type,
        });
    }
}

export default new Index();
