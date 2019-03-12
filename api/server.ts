import { SocketServer } from 'api/socket';
import { ServerOptions } from 'socket.io';

const PORT = parseInt(process.env.API_PORT) || 7008;
const CONFIG: ServerOptions = {
    serveClient: false,
    pingTimeout: 30000,
    pingInterval: 30000,
    transports: [
        'websocket',
    ],
};

const server = new SocketServer(PORT, CONFIG);
server.run();
