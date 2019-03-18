import { CONNECT_CHANNEL, MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import SocketMiddleware from 'api/middleware/socket';
import coreSocketClient from 'api/socket/client';

import { Message } from 'shared/model/message';
import { ISocketServer, SocketServer } from 'shared/driver/socket/server';

const io = require('socket.io');
import { logger } from 'shared/util/logger';

export class ApiSocketServer extends SocketServer implements ISocketServer {

    run() {
        try {
            this.socket = io(this.port, this.config);

            this.socket.on(CONNECT_CHANNEL, (socket: any) => SocketMiddleware.onConnect(socket));
            coreSocketClient.on(MESSAGE_CHANNEL, (message: Message) =>
                SocketMiddleware.onCoreMessage(message, this.socket));
        } catch (error) {
            logger.error(`ERROR [ API ]: ${ error }`);
        }

    }

}
