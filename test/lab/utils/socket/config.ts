import { ServerOptions } from 'socket.io';

export const TEST_SOCKET_SERVER_CONFIG: ServerOptions = {
    serveClient: false,
    pingTimeout: 30000,
    pingInterval: 30000,
};

export const SOCKET_CLIENT_CONFIG = {
    transports: [
        'websocket',
    ],
};

export const TEST_RUNNER_HOST = process.env.TEST_RUNNER_HOST;
export const TEST_RUNNER_PORT = Number(process.env.TEST_RUNNER_PORT);

