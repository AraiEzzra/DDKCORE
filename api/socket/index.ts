import { ServerOptions } from 'socket.io';
import { CONNECT_CHANNEL, MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import SocketMiddleware from 'api/middleware/socket';
import coreSocketClient from 'api/driver/socket/core';
import { Message } from 'shared/model/message';

const io = require('socket.io');

export class SocketServer {

    private readonly port: number;
    private readonly config: ServerOptions;

    private socket: SocketIO.Server;

    constructor(port: number, config: ServerOptions) {
        this.port = port;
        this.config = config;
    }

    run() {
        this.socket = io(this.port, this.config);

        this.socket.on(CONNECT_CHANNEL, (socket: any) => SocketMiddleware.onAPIConnect(socket));
        coreSocketClient.on(MESSAGE_CHANNEL, (message: Message) =>
            SocketMiddleware.onCoreMessage(message, this.socket));
    }
}

