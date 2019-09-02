import uuid4 from 'uuid/v4';
import { PEER_SOCKET_CHANNELS, PEER_SOCKET_EVENTS } from 'core/driver/socket/socketsTypes';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';
import { SocketBufferRPC, SocketResponse, SocketResponseRPC } from 'shared/model/socket';
import { PeerAddress } from 'shared/model/types';
import { messageON } from 'shared/util/bus';
import { ActionTypes } from 'core/util/actionTypes';
import { Peer, SerializedPeer } from 'shared/model/Peer/index';
import { REQUEST_TIMEOUT } from 'core/driver/socket';
import config, { NODE_ENV_ENUM } from 'shared/config';
import { ALLOWED_BAN_PEER_METHODS, ALLOWED_METHODS } from 'core/util/allowedPeerMethods';
import { peerAddressToString } from 'core/util/peer';
import { createBufferObject, deserialize } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { BusyWorkParser } from 'core/util/busyWorkParser';

type SerializedNetworkPeer = SerializedPeer & {
    socket: SocketIO.Socket | SocketIOClient.Socket;
    isBanned: boolean;
};

export class NetworkPeer extends Peer {
    private _socket: SocketIO.Socket | SocketIOClient.Socket;
    private _isBanned: boolean;

    constructor(data: SerializedNetworkPeer) {
        super(data);

        logger.debug(`[Peer][new peer] ${peerAddressToString(data.peerAddress)}`);
        this._isBanned = data.isBanned;

        this._socket = data.socket;
        this._socket.on(PEER_SOCKET_CHANNELS.SOCKET_RPC_REQUEST, (response: Buffer | string) => {
            this._onRPCRequest(response);
        });
        this._socket.on(PEER_SOCKET_CHANNELS.BROADCAST, (response: Buffer | string) => {
            this._onBroadcast(response, this.peerAddress);
        });

        this._socket.on(PEER_SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.debug(`[NetworkPeer][disconnect]: ${reason}`);
            this._socket.removeAllListeners();
            if (reason !== 'client namespace disconnect') {
                messageON(ActionTypes.REMOVE_PEER, data.peerAddress);
            }
        });
    }

    get id(): string {
        return this._socket.id;
    }

    get isBanned(): boolean {
        return this._isBanned;
    }

    ban() {
        this._isBanned = true;
    }

    unban() {
        this._isBanned = false;
    }

    send(code: string, data: any): void {
        this._socket.emit(
            PEER_SOCKET_CHANNELS.BROADCAST,
            JSON.stringify({ code, data })
        );
    }

    sendFullHeaders(fullHeaders): void {
        this._socket.emit(
            PEER_SOCKET_CHANNELS.HEADERS,
            JSON.stringify(fullHeaders)
        );
    }

    async requestRPC<T>(code, data): Promise<ResponseEntity<T>> {
        const requestId = uuid4();
        const serializer = new SocketBufferRPC();
        return new Promise((resolve) => {
            const responseListener = (response) => {

                if (Buffer.isBuffer(response)) {
                    if (serializer.getRequestId(response) === requestId) {

                        const result = serializer.unpack(response);
                        clearTimeout(timerId);

                        this._socket.removeListener(PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE, responseListener);

                        resolve(new ResponseEntity({ data: result.data }));
                    }


                } else {
                    // TODO delete this 'if' after migrate
                    response = new SocketResponseRPC(response);
                    if (response.requestId && response.requestId === requestId) {
                        clearTimeout(timerId);

                        this._socket.removeListener(PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE, responseListener);

                        resolve(new ResponseEntity({ data: response.data }));
                    }
                }
            };

            const timerId = setTimeout(
                ((socket, res) => {
                    return () => {
                        socket.removeListener(PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE, responseListener);
                        res(new ResponseEntity({ errors: [REQUEST_TIMEOUT] }));
                    };
                })(this._socket, resolve),
                config.CONSTANTS.CORE_REQUEST_TIMEOUT
            );

            this._socket.emit(
                PEER_SOCKET_CHANNELS.SOCKET_RPC_REQUEST,
                JSON.stringify({ code, data, requestId })
            );

            this._socket.on(PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE, responseListener);
        });
    }

    responseRPC(code, data, requestId): void {
        this._socket.emit(
            PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE,
            JSON.stringify({ code, data, requestId })
        );
    }

    disconnect(): void {
        this._socket.removeAllListeners();
        logger.debug(`[NetworkPeer][disconnect] ${this.peerAddress.ip}`);
        if (this._socket.connected) {
            logger.debug(`[NetworkPeer][disconnect] ${this.peerAddress.ip} was connected`);
            this._socket.disconnect(true);
            logger.debug(`[NetworkPeer][disconnect] ${this.peerAddress.ip} has disconnected`);
        }
    }

    private _onBroadcast(str: Buffer | string, peerAddress: PeerAddress): void {

        const migrateParser = new BusyWorkParser();
        const response = migrateParser.parseBroadcast(str);

        if (!ALLOWED_METHODS.has(response.code) && config.NODE_ENV_IN !== NODE_ENV_ENUM.TEST) {
            return logger.error(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${response.code} ` +
                +`try to execute disallowed method`);
        }

        if (ALLOWED_BAN_PEER_METHODS.has(response.code) || !this._isBanned) {
            logger.info(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}], CODE: ${response.code}`);
            messageON(response.code, { data: response.data, peerAddress });
        } else {
            logger.debug(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${response.code} ` +
                +`try to broadcast, but it has been banned`);
        }
    }

    private _onRPCRequest(str: Buffer | string): void {

        const migrateParser = new BusyWorkParser();
        const response = migrateParser.parseRPCRequest(str);

        if (!ALLOWED_METHODS.has(response.code)) {
            return logger.error(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${response.code} ` +
                +`try to execute disallowed method`);
        }
        logger.trace(
            `[Peer][${peerAddressToString(this.peerAddress)}][onRPCRequest] CODE: ${response.code}, ` +
            `REQUEST_ID: ${response.requestId}}`
        );
        messageON(
            response.code, {
                data: response.data,
                requestPeerInfo: {
                    peerAddress: this.peerAddress,
                    requestId: response.requestId
                }
            });
    }
}
