const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_BALANCE', function () {

  const ADDRESS = 'DDK7214959811294852078';
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

  describe('Checked method result', function () {

    it('should have valid parameters', function (done) {

      wsc.call('GET_BALANCE', {address: ADDRESS}, (result) => {
        expect(result).to.be.an('object');
        expect(result.balance).to.be.an('string');
        expect(result.unconfirmedBalance).to.be.an('string');
        done();
      });

    });

  })

});
