var WebSocket = require('rpc-websockets').Client;

const URL = 'ws://localhost:8080';


class ClientRPCApi {

  constructor() {
    this.counter = 0;
    this.webSocket = new WebSocket(URL);
    this.registered = {};
  }

  getWebSocket() {
    return this.webSocket;
  }



  close() {
    if (this.webSocket.ready) {
      this.webSocket.close();
    }
  }

  openRemaster() {
    if (this.webSocket.ready) {
      this.webSocket.close();
    }



  }

  calling (method, args, callback) {
    if (!this.webSocket.ready) {
      this.open(method, args, callback);
    } else {
        this.webSocket.call(method, this.prepare(method, args))
          .then((result) => {
            callback.call(this, result);
        });
    }
  }

  open(method, args, callback) {
    this.webSocket.on('open', () => {
      this.webSocket.call(method, this.prepare(method, args))
        .then((result) => {
          callback.call(this, result);
        });
    });
  }

  prepare(method, params = []) {
    return {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: ++ this.counter,
    };
  }

}

const client = new ClientRPCApi();

client.calling('header', {
    source: 'FILL NOT DIGGER',
    trx: 'AS23DWF3L4I65FR62GY',
  }, function (result)  {
  client.close();
});

client.calling('headers', {
    source: 'FILL NOT DIGGER',
    trx: 'AS23DWF3L4I65FR62GY',
  }, function (result)  {
  client.close();
});
