import { expect } from 'chai';
import { TestSocketServer } from 'test/lab/utils/socket/testSocketServer';
import { TEST_SOCKET_SERVER_CONFIG } from 'test/lab/utils/socket/config';
import { CONNECT_CHANNEL } from 'shared/driver/socket/channels';

const synchronization: Map<string, boolean> = new Map();

before(function (done) {
    this.timeout(50000);
    const nodeName = process.env.NODE_NAME;
    if (nodeName === 'TEST_RUNNER') {
        const testSocketServer = new TestSocketServer(4000, TEST_SOCKET_SERVER_CONFIG);
        testSocketServer.run();

        testSocketServer.socket.on(CONNECT_CHANNEL, (socket: SocketIO.Socket) => {
            console.log(`Test node ${JSON.stringify(socket.handshake.address)} is connected to server`);
            socket.on('sync', (data: any) => {
                console.log(`Node: ${data.node} is trying to establish before test`);
                synchronization.set(data.node, true);
                socket.emit('SYNC_RESPONSE');
                const synchResult = [...synchronization.values()];
                if (synchResult.length && synchResult.length === 2) {
                    done();
                }
            });
        });
    } else {
        socketClient.emit('sync', { node: nodeName, sync: true });
        socketClient.on('SYNC_RESPONSE', () => {
            done();
        });
    }
});
