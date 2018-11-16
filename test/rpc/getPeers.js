const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_PEERS', function () {

  let wsc;

  before(function (done) {
    wsc = new TestWebSocketConnector();
    wsc.open(done);
  });

  after(function (done) {
    wsc.close();
    done();
  });

  describe('Checked connection', function () {
    it('socket is ready', function (done) {
        expect(wsc.ws.ready).to.equals(true);
        done();
    });
  });

  describe('Call and checked method result', function () {

    it('should have valid parameters', function (done) {
      wsc.call('GET_PEERS', {}, (result) => {
        expect(result).to.be.an('object');
        expect(result.peers).to.be.an('array');

        result.peers.forEach((peer) => {
          expect(peer).to.have.property('ip');
          expect(peer).to.have.property('port');
          expect(peer).to.have.property('state');
          expect(peer).to.have.property('os');
          expect(peer).to.have.property('version');
          expect(peer).to.have.property('dappid');
          expect(peer).to.have.property('broadhash');
          expect(peer).to.have.property('height');
          expect(peer).to.have.property('clock');
          expect(peer).to.have.property('updated');
          expect(peer).to.have.property('nonce');
        });
        done();
      });
    });

  })

});
