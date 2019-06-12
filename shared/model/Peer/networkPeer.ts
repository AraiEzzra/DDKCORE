import uuid4 from 'uuid/v4';
import { PEER_SOCKET_CHANNELS, PEER_SOCKET_EVENTS } from 'core/driver/socket/socketsTypes';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';
import { SocketResponse, SocketResponseRPC } from 'shared/model/socket';
import { SOCKET_RPC_REQUEST_TIMEOUT } from 'core/util/const';
import { PeerAddress } from 'shared/model/types';
import { messageON } from 'shared/util/bus';
import { ActionTypes } from 'core/util/actionTypes';
import { Peer, SerializedPeer } from 'shared/model/Peer/index';
import { REQUEST_TIMEOUT } from 'core/driver/socket';

export const ALLOWED_METHODS: Set<string> = new Set([
    ActionTypes.RESPONSE_BLOCKS,
    ActionTypes.REQUEST_COMMON_BLOCKS,
    ActionTypes.PEER_HEADERS_UPDATE,
    ActionTypes.REQUEST_PEERS,
]);

type SerializedNetworkPeer = SerializedPeer & {
    socket: SocketIO.Socket | SocketIOClient.Socket;
    isBanned: boolean;
};

export class NetworkPeer extends Peer {
    private _socket: SocketIO.Socket | SocketIOClient.Socket;
    private _isBanned: boolean;

    constructor(data: SerializedNetworkPeer) {
        super(data);

        logger.debug(`[Peer][new peer] ${data.peerAddress.ip}:${data.peerAddress.port}`);
        this._isBanned = data.isBanned;

        this._socket = data.socket;
        this._socket.on(PEER_SOCKET_CHANNELS.SOCKET_RPC_REQUEST, (response: string) => {
            this._onRPCRequest(response);
        });
        this._socket.on(PEER_SOCKET_CHANNELS.BROADCAST, (response: string) => {
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
        return new Promise((resolve) => {
            const responseListener = (response) => {
                response = new SocketResponseRPC(response);
                if (response.requestId && response.requestId === requestId) {
                    clearTimeout(timerId);

                    this._socket.removeListener(PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE, responseListener);

                    resolve(new ResponseEntity({ data: response.data }));
                }
            };

            const timerId = setTimeout(
                ((socket, res) => {
                    return () => {
                        socket.removeListener(PEER_SOCKET_CHANNELS.SOCKET_RPC_RESPONSE, responseListener);
                        res(new ResponseEntity({ errors: [REQUEST_TIMEOUT] }));
                    };
                })(this._socket, resolve),
                SOCKET_RPC_REQUEST_TIMEOUT
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

    private _onBroadcast(response: string, peerAddress: PeerAddress): void {
        const { code, data } = new SocketResponse(response);

        if (ALLOWED_METHODS.has(code) || !this._isBanned) {
            logger.trace(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}], CODE: ${code}`);
            messageON(code, { data, peerAddress });
        } else {
            logger.debug(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${code} try to broadcast,` +
                `but it has been banned`);
        }
    }

    private _onRPCRequest(response: string): void {
        const { code, data, requestId } = new SocketResponseRPC(response);
        logger.debug(
            `[Peer][${this.peerAddress.ip}:${this.peerAddress.port}][onRPCRequest] CODE: ${code}, ` +
            `REQUEST_ID: ${requestId}}`
        );
        messageON(code, { data, requestPeerInfo: { peerAddress: this.peerAddress, requestId } });
    }
}
