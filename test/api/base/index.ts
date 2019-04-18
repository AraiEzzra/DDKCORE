import config from 'shared/config';
import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';

export const API_URL = `ws://${config.API.SOCKET.HOST}:${config.API.SOCKET.PORT}`;

export const socket = require('socket.io-client')(API_URL, {
    transports: ['websocket'],
});

export const getSocket = () =>
    require('socket.io-client')(API_URL, {
        transports: ['websocket'],
    });

export const socketRequest = <T>(message: Message2<T>): Promise<Message2<ResponseEntity<any>>> =>
    new Promise(resolve => {
        let s = getSocket();
        s.emit('message', message);
        s.on('message', (response: Message2<ResponseEntity<any>>) => {
            if (response.headers.id === message.headers.id) {
                resolve(response);
                socket.close();
            }
        });
    });
