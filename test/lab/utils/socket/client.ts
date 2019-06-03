import { SocketClient } from 'shared/driver/socket/client';
import { SOCKET_CLIENT_CONFIG, TEST_RUNNER_HOST, TEST_RUNNER_PORT } from 'test/lab/utils/socket/config';
import { TEST_RUNNER_NAME } from 'test/lab/utils/constants';
import { NODE_NAME } from 'test/lab/config';

class SocketFactory {

    private _socketConnection: SocketIOClient.Socket;

    constructor() {
        if (this._socketConnection || NODE_NAME === TEST_RUNNER_NAME) {
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
