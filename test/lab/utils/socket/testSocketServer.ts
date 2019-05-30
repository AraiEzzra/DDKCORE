import { CONNECT_CHANNEL } from 'shared/driver/socket/channels';
import { ISocketServer, SocketServer } from 'shared/driver/socket/server';
import io from 'socket.io';
import { TEST_SOCKET_SERVER_CONFIG } from 'test/lab/utils/socket/config';
import { TEST_SYNC_NAME } from 'test/lab/utils/constants';

export class TestSocketServer extends SocketServer implements ISocketServer {

    public socketPool: Map<string, any>;

    constructor(port: number, config: SocketIO.ServerOptions) {
        super(port, config);
        this.socketPool = new Map();
    }

    async run() {
        this.socket = io(this.port, this.config);

        return new Promise(resolve => {
            this.socket.on(CONNECT_CHANNEL, (socket: SocketIO.Socket) => {
                console.log(`Test node ${JSON.stringify(socket.handshake.address)} is connected to server`);
                socket.on(TEST_SYNC_NAME, (data: any) => {
                    // console.log(`Node: ${data.node} is synchronizing`);
                    const peerName = data.node;
                    this.socketPool.set(peerName, socket);
                    const connectionCount = this.socketPool.size;
                    socket.emit(TEST_SYNC_NAME, { success: true });
                    if (connectionCount === 2) {
                        resolve();
                    }
                });
            });
        });
    }

    register(channel: string, listener: any) {
        const sockets = [...this.socketPool.values()];
        sockets.forEach((socket: any) => {
            socket.on(channel, (data: any) => {
                listener(socket, data);
                socket.emit(channel + '_RESPONSE', {});
            });
        });
    }
}

export default new TestSocketServer(4000, TEST_SOCKET_SERVER_CONFIG);

