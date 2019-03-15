import { ServerOptions } from 'socket.io';

const io = require('socket.io');

export interface ISocketServer {

    readonly port: number;
    readonly config: ServerOptions;

    socket: SocketIO.Server;

    run(): void;

}

export abstract class SocketServer {

    readonly port: number;
    readonly config: ServerOptions;

    socket: SocketIO.Server;

    constructor(port: number, config: ServerOptions) {
        this.port = port;
        this.config = config;
    }

}
