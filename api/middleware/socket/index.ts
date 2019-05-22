import { RPC_METHODS } from 'api/middleware/rpcHolder';
import { Message, MessageType } from 'shared/model/message';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { SOCKET_TIMEOUT_MS } from 'shared/config/socket';
import coreSocketClient from 'api/socket/client';
import { ResponseEntity } from 'shared/model/response';
import SocketIO from 'socket.io';
import { SECOND } from 'shared/util/const';
import config from 'shared/config';
import { logger } from 'shared/util/logger';
import { API_ACTION_TYPES, EVENT_TYPES } from 'shared/driver/socket/codes';

type RequestProcessor = {
    socket: any,
    cleaner: any
};

export class SocketMiddleware {
    private requests: Map<string, RequestProcessor>;

    private requestsPerSecond: number;
    private readonly requestsPerSecondLimit: number;
    private requestsQueue: Array<{ message: Message<any>, socket: SocketIO.Socket }>;

    constructor() {
        this.requests = new Map();
        this.requestsPerSecond = 0;
        this.requestsPerSecondLimit = config.API.REQUESTS_PER_SECOND_LIMIT;
        this.requestsQueue = [];

        setInterval(() => {
            this.requestsPerSecond = 0;
            this.processQueue();
        }, SECOND);
    }

    processQueue = () => {
        let request: { message: Message<any>, socket: SocketIO.Socket };
        while ((request = this.requestsQueue.pop()) && request) {
            const { message, socket } = request;
            this.emitToCore(message, socket);
            if (this.requestsPerSecond >= this.requestsPerSecondLimit) {
                break;
            }
        }
    }

    onConnect(socket: any) {
        logger.trace('Socket %s connected', JSON.stringify(socket.handshake));
        socket.on(MESSAGE_CHANNEL, (data: Message<any>) => this.onApiMessage(data, socket));
    }

    onApiMessage<T>(message: Message<ResponseEntity<T>>, socket: any) {
        const { headers } = message;

        if (headers.type === MessageType.REQUEST) {
            this.processMessage(message, socket);
        } else {
            message.body = new ResponseEntity({ errors: ['Invalid message type'] });
            socket.emit(MESSAGE_CHANNEL, message);
        }

    }

    onCoreMessage<T>(message: Message<ResponseEntity<T>>, socketServer?: SocketIO.Server) {
        if (message.headers.type === MessageType.EVENT) {
            socketServer.emit(MESSAGE_CHANNEL, message);
        }
        this.emitToClient(message.headers.id, message.code, message.body);
    }

    processMessage<T>(message: Message<ResponseEntity<T>>, socket: SocketIO.Socket) {
        const method = RPC_METHODS[message.code];
        if (typeof method === 'function') {
            method(message, socket);
        } else {
            const errors = new ResponseEntity({ errors: ['Invalid request to API'] });
            const errorMessage = new Message<ResponseEntity<T>>(
                MessageType.RESPONSE,
                message.code,
                errors,
                message.headers.id
            );
            socket.emit(MESSAGE_CHANNEL, errorMessage);
        }
    }

    // TODO: extract this to some utils for socket. e.g. driver
    emitToClient<T>(
        requestId: string,
        code: API_ACTION_TYPES | EVENT_TYPES,
        data: ResponseEntity<T>,
        socketClient?: any
    ) {
        const message = new Message<ResponseEntity<T>>(MessageType.RESPONSE, code, data, requestId);

        if (socketClient) {
            socketClient.emit(MESSAGE_CHANNEL, message);
        } else {
            this.emitAndClear(message);
        }
    }

    // TODO: extract this to some utils for socket. e.g. driver
    emitToCore<T>(message: Message<T>, socket: any) {
        if (this.requestsPerSecond >= this.requestsPerSecondLimit) {
            this.requestsQueue.unshift({
                message,
                socket,
            });
            return;
        } else {
            this.requestsPerSecond++;
        }

        const cleaner = this.buildRequestCleaner<T>(message, socket);
        this.requests.set(message.headers.id, { socket, cleaner });
        coreSocketClient.emit(MESSAGE_CHANNEL, message);
    }

    emitAndClear<T>(message: Message<T>) {
        if (this.requests.has(message.headers.id)) {
            const requestProcessor = this.requests.get(message.headers.id);
            const { socket, cleaner } = requestProcessor;
            clearTimeout(cleaner);
            socket.emit(MESSAGE_CHANNEL, message);
            this.requests.delete(message.headers.id);
        }
    }

    buildRequestCleaner<T>(message: Message<T | ResponseEntity<T>>, socket: any) {
        return setTimeout(() => {
            message.body = new ResponseEntity<T>({ errors: ['Request timeout from CORE'] });
            message.headers.type = MessageType.RESPONSE;
            this.requests.delete(message.headers.id);
            socket.emit(MESSAGE_CHANNEL, message);
        }, SOCKET_TIMEOUT_MS);
    }
}

export default new SocketMiddleware();
