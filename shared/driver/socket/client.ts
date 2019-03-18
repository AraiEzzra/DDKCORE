import io from 'socket.io-client';

export class SocketClient {

    private readonly host: string;
    private readonly port: number;
    private readonly protocol: string;
    private readonly config: SocketIOClient.ConnectOpts;

    public socket: SocketIOClient.Socket;

    constructor(host: string, port: number, protocol: string, config?: SocketIOClient.ConnectOpts) {
        this.host = host;
        this.port = port;
        this.protocol = protocol;
        this.config = config;
    }

    connect() {
        this.socket = io(`${this.protocol}://${this.host}:${this.port}`, this.config);
        return this.socket;
    }
}

