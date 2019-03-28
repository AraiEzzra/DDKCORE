import { RPC_METHODS } from 'api/middleware/rpcHolder';
import { Message, Message2, MessageType } from 'shared/model/message';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { SOCKET_TIMEOUT_MS } from 'shared/config/socket';
import coreSocketClient from 'api/socket/client';
import { ResponseEntity } from 'shared/model/response';
import SocketIO from 'socket.io';

type RequestProcessor = {
    socket: any,
    cleaner: any
};

export class SocketMiddleware {

    private requests: Map<string, RequestProcessor>;

    constructor() {

        this.requests = new Map();
    }

    getRequestsPool(): Map<string, any> {
        return this.requests;
    }

    onConnect(socket: any) {
        console.log('Socket %s connected', JSON.stringify(socket.handshake));
        socket.on(MESSAGE_CHANNEL, (data: Message) => this.onApiMessage(data, socket));
    }

    onApiMessage(message: Message, socket: any) {
        const { headers } = message;

        if (headers.type === MessageType.REQUEST) {
            this.processMessage(message, socket);
        } else {
            message.body = new ResponseEntity({ errors: ['Invalid message type'] });
            socket.emit(MESSAGE_CHANNEL, message);
        }

    }

    onCoreMessage(message: Message, socketServer?: SocketIO.Server) {
        console.log('ON CORE MESSAGE', message);
        if (message.headers.type === MessageType.EVENT) {
            socketServer.emit(MESSAGE_CHANNEL, message);
        }
        this.emitToClient(message.headers.id, message.code, message.body);
    }

    processMessage(message: Message, socket: any) {
        const method = RPC_METHODS[message.code];
        if (typeof method === 'function') {
            method(message, socket);
        } else {
            const errors = new ResponseEntity({ errors: ['Invalid request to API'] });
            const errorMessage = new Message(MessageType.RESPONSE, message.code, errors, message.headers.id);
            socket.emit(MESSAGE_CHANNEL, errorMessage);
        }
    }

    // TODO: extract this to some utils for socket. e.g. driver
    emitToClient<T>(requestId: string, code: string, data: ResponseEntity<T>, socketClient?: any) {
        const message = new Message(MessageType.RESPONSE, code, data, requestId);

        if (socketClient) {
            socketClient.emit(MESSAGE_CHANNEL, message);
        } else {
            this.emitAndClear(message);
        }
    }

    // TODO: extract this to some utils for socket. e.g. driver
    emitToCore<T>(message: Message2<T>, socket: any) {
        const cleaner = this.buildRequestCleaner(message, socket);
        this.requests.set(message.headers.id, { socket, cleaner });
        coreSocketClient.emit(MESSAGE_CHANNEL, message);
    }

    emitAndClear(message: Message) {
        if (this.requests.has(message.headers.id)) {
            const requestProcessor = this.requests.get(message.headers.id);
            const { socket, cleaner } = requestProcessor;
            clearInterval(cleaner);
            socket.emit(MESSAGE_CHANNEL, message);
            this.requests.delete(message.headers.id);
        }
    }

    buildRequestCleaner(message: Message, socket: any) {
        return setTimeout(() => {
            console.log('CLEANING....');
            message.body = new ResponseEntity({ errors: ['Request timeout from CORE'] });
            message.headers.type = MessageType.RESPONSE;
            this.requests.delete(message.headers.id);
            socket.emit(MESSAGE_CHANNEL, message);
        }, SOCKET_TIMEOUT_MS);
    }
}

export default new SocketMiddleware();
