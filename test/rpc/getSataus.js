const chai = require('chai');
const expect = require('chai').expect;
const WebSocket = require('rpc-websockets').Client;


describe('RPC method: GET_STATUS', function () {

  const URL = 'ws://localhost:8080/v1';
  let ws;

  before(function (done) {
    ws = new WebSocket(URL);
    ws.on('open', done);
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

    it('should have valid parameters', function (done) {
      ws.call('GET_STATUS', {}).then((result) => {

        expect(result).to.be.an('object');
        expect(result.broadhash).to.be.an('string').that.length(64);
        expect(result.epoch).to.be.an('string');
        expect(result.height).to.be.an('number');
        expect(result.fee).to.be.an('number');
        expect(result.milestone).to.be.an('number');
        expect(result.nethash).to.be.an('string').that.have.length(64);
        expect(result.reward).to.be.an('number');
        expect(result.supply).to.be.an('number');

        done();
      });
    });

  });

});
