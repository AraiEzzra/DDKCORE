import config from 'shared/config';

export const API_URL = `ws://${config.API.SOCKET.HOST}:${config.API.SOCKET.PORT}`;

export const socket = require('socket.io-client')(API_URL, {
    transports: ['websocket'],
});

export const getSocket = () =>
    require('socket.io-client')(API_URL, {
        transports: ['websocket'],
    });
