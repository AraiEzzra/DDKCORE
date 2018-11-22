const WebSocket = require('rpc-websockets').Client;
const URL_DEFAULT = 'ws://10.6.0.5:8080/v1';


class TestWebSocketConnector {

  constructor (url) {
    this._ws = new WebSocket(url || URL_DEFAULT);
  }

  get ws () {
    return this._ws;
  }

  open (cb) {
    this.ws.on('open', cb);
  }

  call (methodName, methodParams, cb) {
    this.ws.call(methodName, methodParams).then(cb);
  }

  close () {
    this.ws.close();
  }

}


module.exports = TestWebSocketConnector;