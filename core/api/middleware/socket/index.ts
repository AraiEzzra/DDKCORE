import { API_METHODS } from 'core/api/middleware/apiHolder';
import { Message, MessageType } from 'shared/model/message';
import { CONNECT_TO_CORE, MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import 'core/api/controller/transaction';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';

export class SocketMiddleware {

    onConnect(socket: any) {
        socket.emit(CONNECT_TO_CORE, 'IS CONNECTED');
    }

    registerAPI(socket) {
        socket.on(MESSAGE_CHANNEL, (message: Message) => this.onMessage(message, socket));
    }

    onMessage(message: Message, socket: any) {

        const method = API_METHODS[message.code];

        if (method && typeof method === 'function' && message.headers.type === MessageType.REQUEST) {
            logger.info(`CORE-API: ON API - ${message.code}`);
            message.body = method(message, socket);
            message.headers.type = MessageType.RESPONSE;
            socket.emit(MESSAGE_CHANNEL, message);
        } else {
            logger.error(`CORE-API: Invalid request - ${message.code}`);
            const errors = new ResponseEntity({ errors: ['Invalid request'] });
            const errorMessage = new Message(MessageType.RESPONSE, message.code, errors, message.headers.id);
            socket.emit(MESSAGE_CHANNEL, errorMessage);
        }

    }
}

export default new SocketMiddleware();
