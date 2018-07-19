'use strict';

var WebSocket = require('rpc-websockets').Client;
var WebSocketServer = require('rpc-websockets').Server;


var server = new WebSocketServer({
  port: 8080,
  host: 'localhost'
});

let counter = 0;

server.register('say', function(text) {
  counter ++;
  return `[ ${counter}:"${text}" ]`;
});

server.event('feedUpdated');

//
console.log('eventList', server.eventList());
//
server.emit('feedUpdated');
