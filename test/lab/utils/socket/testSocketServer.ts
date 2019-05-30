import { CONNECT_CHANNEL } from 'shared/driver/socket/channels';
import { ISocketServer, SocketServer } from 'shared/driver/socket/server';
import io from 'socket.io';
import { TEST_SOCKET_SERVER_CONFIG } from 'test/lab/utils/socket/config';

export class TestSocketServer extends SocketServer implements ISocketServer {

    public socketPool: Map<string, any>;

    constructor(port: number, config: SocketIO.ServerOptions) {
        super(port, config);
        this.socketPool = new Map();
    }

    async run() {
        this.socket = io(this.port, this.config);

        const testResult = new Map();

        return new Promise(resolve => {
            const resultObj = new Map();
            this.socket.on(CONNECT_CHANNEL, (socket: SocketIO.Socket) => {
                console.log(`Test node ${JSON.stringify(socket.handshake.address)} is connected to server`);
                socket.on('sync', (data: any) => {
                    console.log(`Node: ${data.node} is trying to establish before test`);
                    const peerName = data.node;
                    this.socketPool.set(peerName, socket);
                    const connectionCount = this.socketPool.size;
                    socket.emit('SYNC_RESPONSE');
                    if (connectionCount === 2) {
                        console.log('RESOLVING...');
                        resolve();
                    }
                });
                // socket.on('abc', (response: any) => {
                //     console.log('RESPONSEEEE ', response);
                //     const peerName = response.node;
                //     testResult.set(peerName, true);
                //     const resultCount = testResult.size;
                //     socket.emit('abc_RESPONSE', {});
                //     if (resultCount === 2) {
                //         resolve();
                //     }
                // });
            });
        });

        // await syncPromise;
    }

    register(channel: string, listener: any) {
        const sockets = [...this.socketPool.values()];
        console.log('SOCKET COUNT: ', sockets.length);
        sockets.forEach((socket: any) => {
            socket.on(channel, (data: any) => {
                console.log('CHANNEL: ', channel);
                listener(socket, data);
                socket.emit(channel + '_RESPONSE', {});
            });
        });
    }
}

export default new TestSocketServer(4000, TEST_SOCKET_SERVER_CONFIG);

