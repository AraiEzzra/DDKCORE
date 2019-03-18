import {API_METHODS} from 'core/api/middleware/apiHolder';
import {Message, MessageType} from 'shared/model/message';
import {MESSAGE_CHANNEL} from 'shared/driver/socket/channels';
import 'core/api/controller/transaction';
import { logger } from 'shared/util/logger';

export class SocketMiddleware {

    registerAPI(socketAPI) {
        socketAPI.on(MESSAGE_CHANNEL, (message: Message) => {

           const method = API_METHODS[message.code];

           if (method && typeof method === 'function' && message.headers.type === MessageType.REQUEST) {
                method(message);
               logger.info(`[ CORE | API ]: ${message.code}`);
           } else {
               const errorMessage =
                    new Message(MessageType.RESPONSE, message.code, ['Request is failed'], message.headers.id);
               socketAPI.emit(MESSAGE_CHANNEL, errorMessage);
               logger.error(`ERROR : [ CORE | API ]: SEND TO API  ${message.code}`);
           }
        });
    }
}

export default new SocketMiddleware();
