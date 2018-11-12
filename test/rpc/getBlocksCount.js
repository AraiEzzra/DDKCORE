const chai = require('chai');
const expect = require('chai').expect;
const WebSocket = require('rpc-websockets').Client;


describe('RPC method: GET_BLOCKS_COUNT', function () {

  const URL = 'ws://localhost:8080/v1';
  let ws;

  before(function (done) {
    ws = new WebSocket(URL, {timeout: 0});
    ws.on('open', function () {
      done();
    });
  });

  after(function (done) {
    ws.close();
    done();
  });

  describe('Checked connection', function () {
    it('socket is ready', function (done) {
        expect(ws.ready).to.equals(true);
        done();
    });
  });

  describe('Checked method result', function () {

    it('should return number', function (done) {
      ws.call('GET_STATUS', {}).then((result) => {
        expect(result).to.be.object;
        expect(result.count).to.be.number;
        done();
      });
    });

  });

});
