import Middleware from 'api/middleware/socket';

const port = process.env.API_PORT || 7008;
const socketConfig = {
    serveClient: false,
    wsEngine: 'ws',
    pingTimeout: 30000,
    pingInterval: 30000,
};
const io: SocketIO.Server = require('socket.io')(port, socketConfig);

io.on('connect', onConnect);

function onConnect(socket: any) {
    console.log('Socket %s connected', JSON.stringify(socket.handshake));

    socket.on('api_message', function (json: string) {
        onApiMessage(json, socket);
    });

    socket.on('core_message', function (json: string) {
        onCoreMessage(json, socket);
    });
}

async function onCoreMessage(json: string, socket: any) {
    console.log('CORE MESSAGE:', JSON.stringify(json));

}

async function onApiMessage(json: string, socket: any) {
    console.log('API MESSAGE:', JSON.stringify(json));

    const { token, code, data } = JSON.parse(json);
    const response = Middleware.processRequest(code, data);

    socket.emit(
        'message',
        JSON.stringify({
            code: code + '_RESPONSE',
            ...response,
        }),
    );
}
