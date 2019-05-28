import { SocketClient } from 'shared/driver/socket/client';
import { SOCKET_CLIENT_CONFIG, TEST_RUNNER_HOST, TEST_RUNNER_PORT } from 'test/lab/utils/socket/config';

export class SocketFactory {

    public socket: SocketClient;

    constructor() {
        this.socket = new SocketClient(TEST_RUNNER_HOST, TEST_RUNNER_PORT, 'ws', SOCKET_CLIENT_CONFIG);
    }

    getSocketConnection() {
        return this.socket.connect();
    }
}
