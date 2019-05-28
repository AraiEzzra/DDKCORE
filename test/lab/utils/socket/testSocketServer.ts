import { CONNECT_CHANNEL } from 'shared/driver/socket/channels';
import { ISocketServer, SocketServer } from 'shared/driver/socket/server';
import io from 'socket.io';

export class TestSocketServer extends SocketServer implements ISocketServer {

    run() {
        this.socket = io(this.port, this.config);
    }
}
