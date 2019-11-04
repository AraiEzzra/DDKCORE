// TODO remove it including socket.io
export const PEER_SOCKET_EVENTS = {
    DISCONNECT: 'disconnect',
    CONNECT: 'connect',
    HEADERS: 'HEADERS',
};

// TODO remove it including socket.io
export const PEER_SOCKET_CHANNELS = {
    HEADERS: 'HEADERS',
    BROADCAST: 'BROADCAST',
    SOCKET_RPC_REQUEST: 'SOCKET_RPC_REQUEST',
    SOCKET_RPC_RESPONSE: 'SOCKET_RPC_RESPONSE',
};

export enum EVENT_CORE_TYPES {
    HEADERS = 'headers',
    MESSAGE = 'message',
    SYSTEM = 'system',
}

export enum WEB_SOCKET_EVENTS {
    CLOSE = 'close',
    CONNECTION = 'connection',
    MESSAGE = 'message',
    ERROR = 'error',
    OPEN = 'open',
}

export enum WEB_SOCKET_STATE {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}
