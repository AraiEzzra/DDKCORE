const WebSocket = require('rpc-websockets').Client;


class TestWebSocketConnector {

  constructor (url) {
    this._ws = new WebSocket(url);
  }

  get ws () {
    return this._ws
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