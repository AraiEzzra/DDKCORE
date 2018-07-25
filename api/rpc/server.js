const WebSocket = require('rpc-websockets').Client;
const WebSocketServer = require('rpc-websockets').Server;

const ReservedErrorCodes = require('./errors');
const { methods, port, host, version } = require('./server.config');
const {
  METHOD_RESULT_STATUS,
  prepareServerRequest,
  getDDKCoinConfig,
} = require('./util');


class ServerRPCApi {

  constructor() {
    this.registered = {};
    this.webSocketServer = new WebSocketServer({
      port: port,
      host: host
    });
  }

  getWebSocketServer() {
    return this.webSocketServer;
  }

  register(method, callback, args) {
    this.registered[method] = {
      method: method,
      callback: callback,
      args: args
    };
    this.webSocketServer.register(method, this.registered[method].callback);
  }

}


const server = new ServerRPCApi();

methods.map((method) => {

  server.register(method.methodName, (args) => {
    if (args.jsonrpc === '2.0') {
      method.methodId = args.id;

      let error = false;
      let methodResult = method.call({}, server.getWebSocketServer(), args.params);

      if (methodResult.status === undefined || methodResult.result === undefined) {
        throw new Error(`Result of [${method.methodName}] not has api structure`);
      } else {
        return prepareServerRequest(methodResult.result, methodResult.error, method.methodId);
      }

    }
  });

});

console.info(`[ServerRPCApi] Started!`);
