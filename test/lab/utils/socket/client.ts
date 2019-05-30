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
