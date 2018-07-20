const WebSocket = require('rpc-websockets').Client;
const WebSocketServer = require('rpc-websockets').Server;

const MethodHeader = require('./methods/header');
const MethodHeaders = require('./methods/headers');
const ReservedErrorCodes = require('./errors');

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

  createError (code, message, data) {
    return {
      code: code,
      message: message,
      data: data,
    };
  }

  prepare(result, error, id) {
    return {
      jsonrpc: "2.0",
      result: result,
      error: error,
      id: id,
    };
  }

}

const serverApi = new ServerRPCApi();

methods.map((method) => {

  serverApi.register(method.methodName, (args) => {

    if (args.jsonrpc === '2.0') {}

    method.methodID = args.id;
    let result = method.call(api, args.params);
    let error = result.error ? result.error : false;

    return serverApi.prepare(result, error, method.methodID);
  } );

});

console.info(`[ServerRPCApi] Server started!`);
