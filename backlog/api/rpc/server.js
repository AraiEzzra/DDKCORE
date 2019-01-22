const WebSocketServer = require('rpc-websockets').Server;
const { port, host, version } = require('./server.config');


class ServerRPCApi {

    constructor() {
        this.registered = {};
        this.port = port;
        this.host = host;
        this.path = `/v${version}`;

        this.webSocketServer = new WebSocketServer({
            port: this.port,
            host: this.host,
        });
    }

    getWebSocketServer() {
        return this.webSocketServer;
    }

    register(method, callback, params) {
        this.registered[method] = {
            method,
            callback,
            params
        };
        this.webSocketServer.register(
            method,
            this.registered[method].callback,
            this.path);
    }

}

module.exports = ServerRPCApi;
