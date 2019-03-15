import Middleware from 'api/middleware/socket';
import { MessageModel, MessageType } from 'shared/model/message';

const DEFAULT_API_PORT = 7008;
const port = process.env.API_PORT || DEFAULT_API_PORT;
const socketConfig = {
    serveClient: false,
    wsEngine: 'ws',
    pingTimeout: 30000,
    pingInterval: 30000,
};
const io = require('socket.io')(port, socketConfig);

io.on('connect', onConnect);

function onConnect(socket: any) {
    console.log('Socket %s connected', JSON.stringify(socket.handshake));

    socket.on('message', function (json: any) {
        onApiMessage(json, socket);
    });
}

async function onApiMessage(data: MessageModel, socket: any) {
    console.log('API MESSAGE:', data);

    const { headers, code, body } = data;
    const result = Middleware.processRequest(code, body);

    const response = new MessageModel(MessageType.RESPONSE, code, result, data.headers.id);
    socket.emit('message', response);
}
