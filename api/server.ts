import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';
import socketCore from 'api/driver/socket/core';
import { MESSAGE_CHANNEL } from 'api/driver/socket/channel';

const port = process.env.API_PORT || 7008;
const socketConfig = {
    serveClient: false,
    wsEngine: 'ws',
    pingTimeout: 30000,
    pingInterval: 30000,
};

const socketServer: SocketIO.Server = require('socket.io')(port, socketConfig);
socketServer.on('connect', onConnect);

socketCore.on(MESSAGE_CHANNEL, (message: Message) => SocketMiddleware.onCoreMessage(message));

function onConnect(socketApi: any) {
    console.log('Socket %s connected', JSON.stringify(socketApi.handshake));

    socketApi.on(MESSAGE_CHANNEL, (data: Message) => SocketMiddleware.onAPIMessage(data, socketApi));
}
