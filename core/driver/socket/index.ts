import io from 'socket.io-client';
import socketIO from 'socket.io';
import config, { DEFAULT_CORE_SOCKET_PORT } from 'shared/config/index';
import { API_SOCKET_SERVER_CONFIG, PEER_SOCKET_CLIENT_CONFIG } from 'shared/config/socket';
import { messageON } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import { IPRegExp } from 'core/util/common';
import { PEER_SOCKET_TYPE, PeerAddress } from 'shared/model/types';
import { ActionTypes } from 'core/util/actionTypes';
import { SerializedFullHeaders } from 'shared/model/Peer/fullHeaders';
import { PEER_SOCKET_EVENTS } from 'core/driver/socket/socketsTypes';
import { peerAddressToString } from 'core/util/peer';
import { createBufferObject, deserialize } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';

export const REQUEST_TIMEOUT = '408 Request Timeout';

export class Socket {
    private static instance: Socket;
    private static ioServer;

    constructor() {
        if (Socket.instance) {
            return Socket.instance;
        }
        Socket.instance = this;
    }

    initServer(): void {
        Socket.ioServer = socketIO(config.CORE.SOCKET.PORT, API_SOCKET_SERVER_CONFIG);

        logger.debug(`WebSocket listening on port ${config.CORE.SOCKET.PORT}`);

        Socket.ioServer.on(PEER_SOCKET_EVENTS.CONNECT, Socket.instance.onServerConnect);

        setTimeout(() => messageON(ActionTypes.PEER_CONNECT_RUN),
            config.CONSTANTS.TIMEOUT_START_PEER_CONNECT);

        setTimeout(() => messageON(ActionTypes.EMIT_REQUEST_PEERS),
            config.CONSTANTS.TIMEOUT_START_PEER_REQUEST
        );
    }

    onServerConnect(socket: socketIO.Socket): void {

        const address = socket.handshake.address || socket.request.connection.remoteAddress;
        if (!address) {
            logger.warn(`[SOCKET][onServerConnect] socket handshake address is missing`);
            socket.disconnect(true);
            return;
        }

        const ip = address.match(IPRegExp).toString();

        if (config.CORE.PEERS.BLACKLIST.indexOf(ip) !== -1) {
            logger.warn(`[SOCKET][onServerConnect] trying to connect from black ip`);
            socket.disconnect(true);
        }

        if (Socket.ioServer.clients().length > config.CONSTANTS.MAX_PEERS_CONNECTED) {
            logger.warn(`[SOCKET][onServerConnect] too many connections, sorry ${ip}`);
            socket.disconnect(true);
        }
        socket.on(PEER_SOCKET_EVENTS.HEADERS, (response: Buffer) => {
                Socket.instance.onHeadersReceive(
                    response, {
                        ip,
                        port: DEFAULT_CORE_SOCKET_PORT
                    },
                    socket, PEER_SOCKET_TYPE.CLIENT);
            }
        );
    }

    connectPeer(peerAddress: PeerAddress, headers: SerializedFullHeaders): void {

        logger.debug(`[SOCKET][connectPeer] connecting to ${peerAddressToString(peerAddress)}...`);
        const ws: SocketIOClient.Socket = io(
            `ws://${peerAddressToString(peerAddress)}`,
            PEER_SOCKET_CLIENT_CONFIG
        );

        ws.on(PEER_SOCKET_EVENTS.CONNECT, () => {

            logger.debug(`[SOCKET][connectPeer] connected to ${peerAddressToString(peerAddress)}`);

            ws.emit(PEER_SOCKET_EVENTS.HEADERS, createBufferObject(headers, SchemaName.FullHeaders));
            ws.on(PEER_SOCKET_EVENTS.HEADERS, (response: Buffer) => {
                Socket.instance.onHeadersReceive(response, peerAddress, ws, PEER_SOCKET_TYPE.SERVER);
            });
        });
    }

    onHeadersReceive(response: Buffer, peerAddress: PeerAddress, socket, type: PEER_SOCKET_TYPE) {
        
        const peerHeaders = deserialize(response);

        logger.debug(`[Driver][Socket][onHeadersReceive] ${type} ${peerAddress.ip}, ` +
            `broadhash: ${peerHeaders.broadhash}, height: ${peerHeaders.height}, ` +
            `buffer size: ${response.length} byte`);

        messageON(ActionTypes.HEADERS_RECEIVE, {
            peerAddress,
            peerHeaders,
            socket,
            type: type,
        });
    }
}

export default new Socket();
