export const API_URL = process.env.API_HOST && process.env.API_PORT
    ? `${process.env.API_HOST}:${process.env.API_PORT}`
    : 'ws://0.0.0.0:7008';

export const socket = require('socket.io-client')(API_URL, {
    transports: ['websocket'],
});

export const getSocket = () =>
    require('socket.io-client')(API_URL, {
        transports: ['websocket'],
    });
