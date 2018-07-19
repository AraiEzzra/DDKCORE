var WebSocket = require('rpc-websockets').Client;
var ws = new WebSocket('ws://localhost:8080');


ws.on('open', function() {

  ws.call('say', ['hello']).then(function(result) {
    console.log('client result', result);
  });

  // ws.notify('openedNewsModule');

  ws.subscribe('feedUpdated');

  ws.on('feedUpdated', function() {
    console.log('on.feedUpdated');
  });

  setInterval(function () {
    ws.call('say', ['hi']).then(function(result) {
      console.log('client result', result);
    });
  }, 1000);

  // ws.unsubscribe('feedUpdated');
  // ws.close()
});