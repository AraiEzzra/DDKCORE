import io from 'socket.io-client';

const CORE_HOST = process.env.CORE_HOST || 'localhost';
const CORE_PORT = process.env.CORE_PORT || 7007;

const socketConfig = {
    transports: ['websocket'],
};

export default io(`ws://${CORE_HOST}:${CORE_PORT}`, socketConfig);
