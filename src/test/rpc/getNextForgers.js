const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_NEXT_FORGERS', function () {

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

      wsc.call('GET_NEXT_FORGERS', {limit: 3}, (result) => {
        expect(result).to.be.an('object');
        expect(result).to.have.property('currentBlock').to.be.an('number');
        expect(result).to.have.property('currentBlockSlot').to.be.an('number');
        expect(result).to.have.property('currentSlot').to.be.an('number');
        expect(result).to.have.property('delegates').to.be.an('array');
        done();
      });

    });

  })

});
