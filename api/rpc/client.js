const WebSocket = require('rpc-websockets').Client;
const URL = 'ws://0.0.0.0:8080/v1';
const ws = new WebSocket(URL);



ws.on('open', function () {

  ws.call('getblocks', {limit: 10, offset: '0'})
    .then(function(result) {
      console.log('getblocks:', result);
    });

  ws.close();

});
