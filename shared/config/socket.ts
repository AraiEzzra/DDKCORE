import { ServerOptions } from 'socket.io';

export const API_SOCKET_SERVER_CONFIG: ServerOptions = {
    serveClient: false,
    pingTimeout: 30000,
    pingInterval: 30000,
    transports: [
        'websocket',
    ],
};

// Define separate config for CORE
export const CORE_SOCKET_SERVER_CONFIG: ServerOptions = { ...API_SOCKET_SERVER_CONFIG };

export const CORE_SOCKET_CLIENT_CONFIG: SocketIOClient.ConnectOpts = {
    transports: [
        'websocket',
    ],
};

export const SOCKET_TIMEOUT_MS = 10000;
