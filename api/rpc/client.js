const WebSocket = require('rpc-websockets').Client;
const URL = 'ws://127.0.0.1:8080/v1';
const ws = new WebSocket(URL);

// todo: tests

ws.on('open', function () {

  console.log('WebSocket opened');

/*  ws.call('getblocks', {limit: 10, offset: '0'}).then(function(result) {
    console.log('getblocks:', result);
  });*/

  ws.call('blockscount', {}).then(function(result) {
    console.log('blockscount:', result);
    ws.close();
  });


});
