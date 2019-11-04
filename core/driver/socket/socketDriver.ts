import WebSocket from 'ws';
import config, { DEFAULT_CORE_SOCKET_PORT } from 'shared/config/index';
import { messageON } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import { PEER_SOCKET_TYPE, PeerAddress, PeerHeadersReceived } from 'shared/model/types';
import { ActionTypes } from 'core/util/actionTypes';
import { WEB_SOCKET_EVENTS } from 'core/driver/socket/socketsTypes';
import { SocketModel } from 'shared/model/socketModel';
import { IPRegExp } from 'core/util/common';
import { EVENT_CORE_TYPES } from 'core/driver/socket/socketsTypes';
import { SerializedFullHeaders } from 'shared/model/Peer/fullHeaders';
import { peerAddressToString } from 'core/util/peer';
import { createBufferObject, createBufferUtf8 } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { Message } from 'eska-common';

export class SocketDriver {
    private static instance: SocketDriver;
    private static server;

    constructor() {
        if (SocketDriver.instance) {
            return SocketDriver.instance;
        }
        SocketDriver.instance = this;
    }

    initServer(): void {

        SocketDriver.server = new WebSocket.Server({ port: config.CORE.SOCKET.PORT });

        logger.debug(`WebSocket listening on port ${config.CORE.SOCKET.PORT}`);

        SocketDriver.server.on(WEB_SOCKET_EVENTS.CONNECTION, SocketDriver.instance.onServerConnect);

        setTimeout(() => messageON(ActionTypes.PEER_CONNECT_RUN),
            config.CONSTANTS.TIMEOUT_START_PEER_CONNECT);

        setTimeout(() => messageON(ActionTypes.EMIT_REQUEST_PEERS),
            config.CONSTANTS.TIMEOUT_START_PEER_REQUEST
        );

        setInterval(() => {
            console.log('==========>', SocketDriver.server.clients.size);
        }, 3000);

    }

    onServerConnect(ws: WebSocket, req): void {

        const address = req.connection.remoteAddress;
        if (!address) {
            logger.warn(`[SOCKET][onServerConnect] socket handshake address is missing`);
            ws.terminate();
            return;
        }

        const ip = address.match(IPRegExp).toString();
        if (config.CORE.PEERS.BLACKLIST.indexOf(ip) !== -1) {
            logger.warn(`[SOCKET][onServerConnect] trying to connect from black ip`);
            ws.terminate();
        }

        const socket = new SocketModel(ws);
        const socketId = socket.generateId();
        socket.subscribe(EVENT_CORE_TYPES.HEADERS, (response: Message<SerializedFullHeaders, EVENT_CORE_TYPES>) => {

                const peerAddress = { ip, port: DEFAULT_CORE_SOCKET_PORT };
                SocketDriver.instance.onHeadersReceive({
                    peerHeaders: response.getBody(),
                    peerAddress,
                    socket,
                    type: PEER_SOCKET_TYPE.CLIENT,
                });
            }
        );
        socket.send(EVENT_CORE_TYPES.SYSTEM, createBufferUtf8(socketId));
        ws.on(WEB_SOCKET_EVENTS.ERROR, (error) => {
            logger.error(`[SOCKET][connectPeer] ${error}`);
        });
    }

    connectPeer(peerAddress: PeerAddress, headers: SerializedFullHeaders): void {

        logger.debug(`[SOCKET][connectPeer] connecting to ${peerAddressToString(peerAddress)}...`);
        const ws: WebSocket = new WebSocket(
            `ws://${peerAddressToString(peerAddress)}`
        );

        ws.on(WEB_SOCKET_EVENTS.OPEN, () => {
            const socket = new SocketModel(ws);
            logger.debug(`[SOCKET][connectPeer] connected to ${peerAddressToString(peerAddress)}`);

            socket.subscribe(EVENT_CORE_TYPES.SYSTEM, (response: Message<string, EVENT_CORE_TYPES>) => {
                socket.unsubscribe(EVENT_CORE_TYPES.SYSTEM);
                socket.id = response.getBody();
                socket.send(EVENT_CORE_TYPES.HEADERS, createBufferObject(headers, SchemaName.FullHeaders));
            });
            socket.subscribe(
                EVENT_CORE_TYPES.HEADERS, (response: Message<SerializedFullHeaders, EVENT_CORE_TYPES>) => {
                    SocketDriver.instance.onHeadersReceive({
                        peerHeaders: response.getBody(),
                        peerAddress,
                        socket,
                        type: PEER_SOCKET_TYPE.SERVER,
                    });
                }
            );
        });
        ws.on(WEB_SOCKET_EVENTS.ERROR, (error) => {
            logger.error(`[SOCKET][connectPeer] ${error}`);
        });
    }

    onHeadersReceive(data: PeerHeadersReceived) {

        data.socket.unsubscribe(EVENT_CORE_TYPES.HEADERS);

        logger.debug(`[Driver][SocketSocket][onHeadersReceive] ${data.type} ${data.peerAddress.ip}, ` +
            `broadhash: ${data.peerHeaders.broadhash}, height: ${data.peerHeaders.height}`);

        messageON(ActionTypes.HEADERS_RECEIVE, data);
    }
}

export default new SocketDriver();
