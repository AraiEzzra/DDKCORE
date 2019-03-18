import { ServerOptions, Server } from 'socket.io';
import { CONNECT_CHANNEL } from 'shared/driver/socket/channels';
import SocketMiddleware from 'core/api/middleware/socket';
import { logger } from 'shared/util/logger';

const io = require('socket.io');

export class SocketServerAPI {

    private readonly port: number;
    private readonly options: ServerOptions;

    private socket: Server;

    constructor(port: number, options: ServerOptions) {
        this.port = port;
        this.options = options;
    }

    run() {
        this.socket = io(this.port, this.options);
        this.socket.on(CONNECT_CHANNEL, (socket: any) => {
            console.log('Socket API Server %s connected', JSON.stringify(socket.handshake));
            SocketMiddleware.registerAPI(socket);
            logger.info(`[ CORE | API ] : SOCKET SERVER IS RUN ON THE PORT ${this.port}`);
        });
    }
}
