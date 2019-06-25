import { ServerOptions } from 'socket.io';

export const API_SOCKET_SERVER_CONFIG: ServerOptions = {
    serveClient: false,
    pingTimeout: 5000,
    pingInterval: 10000,
};

// Define separate config for CORE
export const CORE_SOCKET_SERVER_CONFIG: ServerOptions = { ...API_SOCKET_SERVER_CONFIG };

export const CORE_SOCKET_CLIENT_CONFIG: SocketIOClient.ConnectOpts = {
    transports: [
        'websocket',
    ],
};

export const PEER_SOCKET_CLIENT_CONFIG: SocketIOClient.ConnectOpts = {
    transports: [
        'websocket',
    ],
    reconnection: false,
    timeout: 10000,
};

export const SOCKET_TIMEOUT_MS = 10000;
