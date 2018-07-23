const WebSocket = require('rpc-websockets').Client;
const WebSocketServer = require('rpc-websockets').Server;

const ReservedErrorCodes = require('./errors');
const {
  prepareServerRequest,
} = require('./util');
const MethodHeader = require('./methods/header');
const MethodHeaders = require('./methods/headers');

const methods = [
  MethodHeader,
  MethodHeaders,
];

const PORT = 8080;
const HOST = 'localhost';
const VERSION = 1;


class ServerRPCApi {

  constructor() {
    this.registered = {};
    this.webSocketServer = new WebSocketServer({
      port: PORT,
      host: HOST
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
      let result = method.call({},  server.getWebSocketServer(), args.params);
      let error = result.error ? result.error : false;
      return prepareServerRequest(result, error, method.methodId);
    }
  });

});

console.info(`[ServerRPCApi] Started!`);
