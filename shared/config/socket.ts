import { ServerOptions } from 'socket.io';

export const API_SOCKET_PORT = parseInt(process.env.API_PORT, 1) || 7008;
export const API_SOCKET_SERVER_CONFIG: ServerOptions = {
    serveClient: false,
    pingTimeout: 30000,
    pingInterval: 30000,
    transports: [
        'websocket',
    ],
};

export const CORE_HOST = process.env.API_HOST || 'localhost';
export const CORE_PORT = parseInt(process.env.API_PORT, 1) || 7007;
export const CORE_PROTOCOL = process.env.API_PROTOCOL || 'ws';
export const CORE_SOCKET_CLIENT_CONFIG: SocketIOClient.ConnectOpts = {
    transports: [
        'websocket',
    ],
};

export const SOCKET_TIMEOUT_MS = 10000;
