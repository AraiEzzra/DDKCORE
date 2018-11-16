const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_FEE', function () {

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
      wsc.call('GET_FEE', {}, (result) => {
        expect(result).to.be.an('object');
        expect(result.fee).to.be.an('number');
        done();
      });
    });

  })

});
