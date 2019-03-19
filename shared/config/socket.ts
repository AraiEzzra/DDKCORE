import { ServerOptions } from 'socket.io';

export const API_HOST = process.env.SERVER_HOST || 'localhost';
export const API_SOCKET_PORT = parseInt(process.env.API_PORT, 10) || 7008;
export const API_SOCKET_SERVER_CONFIG: ServerOptions = {
    serveClient: false,
    pingTimeout: 30000,
    pingInterval: 30000,
    transports: [
        'websocket',
    ],
};

// Define separate config for CORE
export const CORE_SOCKET_SERVER_CONFIG: ServerOptions = {...API_SOCKET_SERVER_CONFIG};

export const CORE_HOST = process.env.SERVER_HOST || 'localhost';
export const CORE_PORT = parseInt(process.env.CORE_PORT, 10) || 7007;
export const CORE_RPC_PORT = parseInt(process.env.CORE_RPC_PORT, 10) || 7009;
export const CORE_RPC_PROTOCOL = process.env.CORE_RPC_PROTOCOL || 'ws';
export const CORE_SOCKET_CLIENT_CONFIG: SocketIOClient.ConnectOpts = {
    transports: [
        'websocket',
    ],
};

export const SOCKET_TIMEOUT_MS = 10000;
