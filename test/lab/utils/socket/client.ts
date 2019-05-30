import { SocketClient } from 'shared/driver/socket/client';
import { SOCKET_CLIENT_CONFIG, TEST_RUNNER_HOST, TEST_RUNNER_PORT } from 'test/lab/utils/socket/config';

export const getSocketConnection = (): SocketIOClient.Socket | null => {
    const socket = new SocketClient(TEST_RUNNER_HOST, TEST_RUNNER_PORT, 'ws', SOCKET_CLIENT_CONFIG);
    const nodeName = process.env.NODE_NAME;

    if (nodeName === 'TEST_RUNNER') {
        return null;
    }

    return socket.connect();
};

class SocketFactory {

    private _socketConnection: SocketIOClient.Socket;

    constructor() {
        if (this._socketConnection || process.env.NODE_NAME === 'TEST_RUNNER') {
            return;
        }
        const socket = new SocketClient(TEST_RUNNER_HOST, TEST_RUNNER_PORT, 'ws', SOCKET_CLIENT_CONFIG);
        this._socketConnection = socket.connect();
    }

    get socketConnection(): SocketIOClient.Socket {
        return this._socketConnection;
    }
}

export default new SocketFactory();
