import { CONNECT_CHANNEL } from 'shared/driver/socket/channels';
import SocketMiddleware from 'core/api/middleware/socket';
import { ISocketServer, SocketServer } from 'shared/driver/socket/server';
import { logger } from 'shared/util/logger';
import io from 'socket.io';

export class CoreRPCSocketServer extends SocketServer implements ISocketServer {

    run<T>() {
        this.socket = io(this.port, this.config);
        this.socket.on(CONNECT_CHANNEL, (socket: SocketIO.Socket) => {
            logger.info('API connected to socket server');
            SocketMiddleware.onConnect(socket);
            SocketMiddleware.registerAPI<T>(socket);
        });
    }
}
