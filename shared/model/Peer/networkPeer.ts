import { EVENT_CORE_TYPES } from 'core/driver/socket/socketsTypes';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';
import { PeerAddress } from 'shared/model/types';
import { messageON } from 'shared/util/bus';
import { Peer, SerializedPeer } from 'shared/model/Peer/index';
import config, { NODE_ENV_ENUM } from 'shared/config';
import { ALLOWED_BAN_PEER_METHODS, ALLOWED_METHODS } from 'core/util/allowedPeerMethods';
import { peerAddressToString } from 'core/util/peer';
import { createBufferObject } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { SocketModel } from 'shared/model/socketModel';
import { Message, MessageType } from 'eska-common';
import { ActionTypes } from 'core/util/actionTypes';

type SerializedNetworkPeer = SerializedPeer & {
    socket: SocketModel;
    isBanned: boolean;
};

export class NetworkPeer extends Peer {
    private _socket: SocketModel;
    private _isBanned: boolean;

    constructor(data: SerializedNetworkPeer) {
        super(data);

        logger.debug(`[Peer][new peer] ${peerAddressToString(data.peerAddress)}`);
        this._isBanned = data.isBanned;

        this._socket = data.socket;

        this._socket.onCloseFn = this._onClose(this.peerAddress);

        this._socket.subscribe(EVENT_CORE_TYPES.MESSAGE, (message: Message<any, any>) => {

            if (message.headers.type === MessageType.EVENT) {
                this._onBroadcast(message.getBody(), this.peerAddress);
            } else if (message.headers.type === MessageType.REQUEST) {
                this._onRPCRequest(message.getBody(), message.getId());
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

    send(data: Buffer): void {
        this._socket.send(
            EVENT_CORE_TYPES.MESSAGE,
            data
        );
    }

    sendFullHeaders(fullHeaders): void {
        this._socket.send(
            EVENT_CORE_TYPES.HEADERS,
            createBufferObject(fullHeaders, SchemaName.FullHeaders),
        );
    }

    async requestRPC<T>(code, data: Buffer): Promise<ResponseEntity<T>> {
        return await this._socket.request(EVENT_CORE_TYPES.MESSAGE, createBufferObject({
            code,
            data
        }, SchemaName.Request));
    }

    responseRPC(code, data: Buffer, requestId: string): void {
        this._socket.response(EVENT_CORE_TYPES.MESSAGE,
            createBufferObject({
                code,
                data
            }, SchemaName.Request),
            requestId
        );
    }

    disconnect(): void {
        this._socket.disconnect(config.PUBLIC_HOST);
    }

    private _onClose(peerAddress) {
        return (code, reason) => {
            if (reason !== config.PUBLIC_HOST) {
                messageON(ActionTypes.REMOVE_PEER, peerAddress);
            }
        };
    }

    private _onBroadcast(response, peerAddress: PeerAddress): void {

        if (!ALLOWED_METHODS.has(response.code) && config.NODE_ENV_IN !== NODE_ENV_ENUM.TEST) {
            return logger.error(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${response.code} ` +
                +`try to execute disallowed method`);
        }

        if (ALLOWED_BAN_PEER_METHODS.has(response.code) || !this._isBanned) {
            logger.debug(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}], CODE: ${response.code}`);
            messageON(response.code, { data: response.data, peerAddress });
        } else {
            logger.debug(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${response.code} ` +
                +`try to broadcast, but it has been banned`);
        }
    }

    private _onRPCRequest(response, id: string): void {

        if (!ALLOWED_METHODS.has(response.code)) {
            return logger.error(`[SOCKET][ON_PEER_BROADCAST][${this.peerAddress.ip}] CODE: ${response.code} ` +
                +`try to execute disallowed method`);
        }

        messageON(
            response.code, {
                data: response.data,
                requestPeerInfo: {
                    peerAddress: this.peerAddress,
                    requestId: id
                }
            });
    }
}
