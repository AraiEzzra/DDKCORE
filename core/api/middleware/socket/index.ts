import { API_METHODS } from 'core/api/middleware/apiHolder';
import { Message, MessageType } from 'shared/model/message';
import { CONNECT_TO_CORE, MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { ResponseEntity } from 'shared/model/response';
import { EVENT_TYPES } from 'shared/driver/socket/codes';

class SocketMiddleware {

    apiSocket: any;

    onConnect(socket: any) {
        socket.emit(CONNECT_TO_CORE, 'IS CONNECTED');
        this.apiSocket = socket;
    }

    registerAPI<T>(socket) {
        socket.on(MESSAGE_CHANNEL, (message: Message<T>) => this.onMessage<T>(message, socket));
    }

    onMessage<T>(message: Message<T>, socket: any) {
        const method = API_METHODS[message.code];
        if (method && typeof method === 'function' && message.headers.type === MessageType.REQUEST) {
            message.body = method(message, socket);
            message.headers.type = MessageType.RESPONSE;
            socket.emit(MESSAGE_CHANNEL, message);
        } else {
            const errors = new ResponseEntity({ errors: ['Invalid request to CORE'] });
            const errorMessage = new Message<ResponseEntity<T>>(
                MessageType.RESPONSE,
                message.code,
                errors,
                message.headers.id
            );
            socket.emit(MESSAGE_CHANNEL, errorMessage);
        }

    }

    emitEvent<T>(code: EVENT_TYPES, data: T) {
        const message = new Message<ResponseEntity<T>>(MessageType.EVENT, code, data);
        if (this.apiSocket) {
            this.apiSocket.emit(MESSAGE_CHANNEL, message);
        }
    }
}

export default new SocketMiddleware();
