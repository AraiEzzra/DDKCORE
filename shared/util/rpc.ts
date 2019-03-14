const WebSocketClient = require('rpc-websockets').Client;
const WebSocketServer = require('rpc-websockets').Server;
import config from 'config/env';

export class RPCConnector {

    private rpcClient;
    private rpcNode;
    private host: string;
    private port: number;

    constructor() {
        this.port = config.serverPort;
        this.host = config.serverHost;
    }

    initServer(host?: string, port?: number) {
       this.rpcNode = new WebSocketServer({
           port: port || this.port,
           host: host || this.host
       });
    }

    initClient(host?: string, port?: number) {
        host = host ? host : this.host;
        port = port ? port : this.port;
        this.rpcClient = new WebSocketClient(`ws://${host}:${port}`);
    }

    getRPCServer() {
       return this.rpcNode;
    }

    getRPCClient() {
        return this.rpcClient;
    }

    register(method, callback) {
        this.rpcNode.register(
            method,
            callback
        );
    }

    disconnectRPC() {
        if (this.rpcClient) {
            this.rpcClient.close();
            this.rpcClient = null;
        }
        if (this.rpcNode) {
            this.rpcNode.close();
            this.rpcNode = null;
        }
    }
}
