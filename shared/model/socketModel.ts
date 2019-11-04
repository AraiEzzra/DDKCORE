import WebSocket from 'ws';
import uuid4 from 'uuid/v4';
import { Message, MessageType } from 'eska-common';
import { EVENT_CORE_TYPES, WEB_SOCKET_EVENTS, WEB_SOCKET_STATE } from 'core/driver/socket/socketsTypes';
import { ResponseEntity } from 'shared/model/response';
import config from 'shared/config';
import { createBufferObject, deserialize } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { logger } from 'shared/util/logger';

export const REQUEST_TIMEOUT = '408 Request Timeout';
const DEFAULT_SOCKET_CLOSE_CODE = 1001;

type AnyFunction = (message: Message<any, any>) => any;
type OnCloseFunction = (code, reason) => any;

interface ISocket {
    send(channel: EVENT_CORE_TYPES, data: Buffer): void;

    request(channel: EVENT_CORE_TYPES, data: Buffer): Promise<any>;

    response(channel: EVENT_CORE_TYPES, data: Buffer, requestId: string): void;

    subscribe(channel: EVENT_CORE_TYPES, fn: AnyFunction): void;

    unsubscribe(channel: EVENT_CORE_TYPES, fn: AnyFunction): void;

    disconnect(reason?): void;
}

export class SocketModel implements ISocket {
    private _socket: WebSocket;
    private _store: Map<string, Set<AnyFunction>>;
    private _id: string;
    private _onCloseFn?: OnCloseFunction;

    constructor(socket: WebSocket) {
        this._socket = socket;
        this._store = new Map();
        this._listen();
        this._socket.on(WEB_SOCKET_EVENTS.CLOSE, (code, reason) => {
            this._store.clear();
            if (this._onCloseFn && typeof this._onCloseFn === 'function') {
                this._onCloseFn(code, reason);
            }
        });
    }

    set id(id: string) {
        this._id = id;
    }

    get id(): string {
        return this._id;
    }

    set onCloseFn(fn: OnCloseFunction) {
        this._onCloseFn = fn;
    }

    generateId(): string {
        this.id = uuid4();
        return this.id;
    }

    send(channel: EVENT_CORE_TYPES, data: Buffer) {
        if (this._socket.readyState !== WEB_SOCKET_STATE.OPEN) {
            logger.error(`[SocketModel][send] error, ${WEB_SOCKET_STATE[this._socket.readyState]}`);
            return;
        }
        const message = new Message(MessageType.EVENT, channel, data);
        this._socket.send(createBufferObject(message.serialize(), SchemaName.Message));
    }

    async request<T>(channel: EVENT_CORE_TYPES, data: Buffer): Promise<ResponseEntity<T>> {

        if (this._socket.readyState !== WEB_SOCKET_STATE.OPEN) {
            return new ResponseEntity(
                {
                    errors: [`[SocketModel][request] error, ${WEB_SOCKET_STATE[this._socket.readyState]}`]
                });
        }

        const messageRequest = new Message(MessageType.REQUEST, channel, data);
        return new Promise((resolve) => {
            const responseListener = (messageResponse: Message<any, any>) => {
                if (messageResponse.headers.type === MessageType.RESPONSE &&
                    messageRequest.getId() === messageResponse.getId()) {
                    clearTimeout(timerId);
                    this.unsubscribe(channel, responseListener);
                    const body = messageResponse.getBody();
                    resolve(new ResponseEntity({ data: body.data }));
                }
            };

            const timerId = setTimeout(
                () => {
                    this.unsubscribe(channel, responseListener);
                    resolve(new ResponseEntity({ errors: [REQUEST_TIMEOUT] }));
                },
                config.CONSTANTS.CORE_REQUEST_TIMEOUT
            );

            this._socket.send(createBufferObject(messageRequest.serialize(), SchemaName.Message));

            this.subscribe(channel, responseListener);
        });
    }

    subscribe(channel, fn: AnyFunction) {
        if (!this._store.has(channel)) {
            this._store.set(channel, new Set());
        }
        this._store.get(channel).add(fn);
    }

    unsubscribe(channel, fn?: AnyFunction) {
        fn ? this._store.get(channel).delete(fn) : this._store.delete(channel);
    }

    response(channel, data: Buffer, requestId) {
        if (this._socket.readyState !== WEB_SOCKET_STATE.OPEN) {
            logger.error(`[SocketModel][response] error, ${WEB_SOCKET_STATE[this._socket.readyState]}`);
            return;
        }

        const messageResponse = new Message(MessageType.RESPONSE, channel, data, requestId);
        this._socket.send(createBufferObject(messageResponse.serialize(), SchemaName.Message));
    }

    private _listen() {
        this._socket.on(WEB_SOCKET_EVENTS.MESSAGE, (buffer: Buffer) => {

            if (!Buffer.isBuffer(buffer)) {
                logger.error(`[SocketModel][listen] error, response data is not a buffer, ${buffer}`);
                return;
            }

            const data = deserialize(buffer);
            const message = Message.deserialize(data);
            const code = message.getCode();

            if (code && this._store.has(code)) {
                this._store.get(code).forEach((fn: AnyFunction) => {
                    fn(message);
                });
            }

        });
    }

    disconnect(reason) {
        this._socket.close(DEFAULT_SOCKET_CLOSE_CODE, reason);
    }
}
