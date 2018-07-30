const WebSocket = require('rpc-websockets').Client;
const WebSocketServer = require('rpc-websockets').Server;
const { methods, port, host, version } = require('./server.config');


class ServerRPCApi {

  constructor() {

    this.registered = {};
    this.port = port;
    this.host = host;
    this.path = 'v' + version;

    this.webSocketServer = new WebSocketServer({
      port: this.port,
      host: this.host,
      path: this.path,
    });
  }

  getWebSocketServer() {
    return this.webSocketServer;
  }

  register(method, callback, params) {
    this.registered[method] = {
      method: method,
      callback: callback,
      params: params
    };
    this.webSocketServer.register(method, this.registered[method].callback);
  }

}

module.exports = ServerRPCApi;