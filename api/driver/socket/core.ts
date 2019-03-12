import io from 'socket.io-client';

const CORE_PROTOCOL = process.env.CORE_PROTOCOL || 'ws';
const CORE_HOST = process.env.CORE_HOST || 'localhost';
const CORE_PORT = process.env.CORE_PORT || 7007;

const socketConfig: SocketIOClient.ConnectOpts = {
    transports: ['websocket'],
};

export default io(`${CORE_PROTOCOL}://${CORE_HOST}:${CORE_PORT}`, socketConfig);
