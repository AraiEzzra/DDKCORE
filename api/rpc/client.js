const WebSocket = require('rpc-websockets').Client;


const URL = 'ws://127.0.0.1:8080';
const ws = new WebSocket(URL);


const params = {limit: 10, offset: '0', sort: 'height:desc'};

ws.on('open', function () {

  ws.call('block', params).then(function(result) {
    console.log('block result', result);
  });

  ws.call('header', params).then(function(result) {
    console.log('header result', result);
  });

});



