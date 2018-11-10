const chai = require('chai');
const expect = require('chai').expect;
const WebSocket = require('rpc-websockets').Client;


describe('RPC method', function () {

  // todo: client
  const URL = 'ws://localhost:8080/v1';
  const ws = new WebSocket(URL);

  describe('getBlocksCount', function () {

    it('should return number', function (done) {
      ws.on('open', function () {
        ws.call('getBlocksCount', {}).then(function(result) {
          expect(result).to.be.object;
          expect(result.count).to.be.number;
          done();
          ws.close();
        });
      });
    });

  });

});
