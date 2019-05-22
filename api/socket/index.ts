import { CONNECT_CHANNEL, MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import SocketMiddleware from 'api/middleware/socket';
import coreSocketClient from 'api/socket/client';

import { ISocketServer, SocketServer } from 'shared/driver/socket/server';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';

const io = require('socket.io');

export class ApiSocketServer extends SocketServer implements ISocketServer {

    run<T>() {
        this.socket = io(this.port, this.config);
        this.socket.on(CONNECT_CHANNEL, (socket: any) => SocketMiddleware.onConnect(socket));
        coreSocketClient.on(MESSAGE_CHANNEL, (message: Message<ResponseEntity<T>>) =>
            SocketMiddleware.onCoreMessage(message, this.socket));
    }
}
