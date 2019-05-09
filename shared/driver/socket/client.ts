import io from 'socket.io-client';
import { CONNECT_CHANNEL, DISCONNECT_CHANNEL } from 'shared/driver/socket/channels';
import { logger } from 'shared/util/logger';

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
        logger.trace(`Socket connecting to: ${this.protocol}://${this.host}:${this.port}`);
        this.socket = io(`${this.protocol}://${this.host}:${this.port}`, this.config);

        this.socket.on(CONNECT_CHANNEL, () => {
            logger.trace(`Socket connected to: ${this.protocol}://${this.host}:${this.port}`);
        });

        this.socket.on(DISCONNECT_CHANNEL, () => {
            logger.trace(`Socket disconnected from: ${this.protocol}://${this.host}:${this.port}`);
        });

        return this.socket;
    }
}
