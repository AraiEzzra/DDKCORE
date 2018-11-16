const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_BLOCK', function () {

  const BLOCK_ID = '7807109686729042739';
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

      wsc.call('GET_BLOCK', {id: BLOCK_ID}, (result) => {
        expect(result).to.be.an('object');
        expect(result.block).to.be.an('object');
        expect(result.block).to.have.property('id');
        expect(result.block).to.have.property('height');
        expect(result.block).to.have.property('timestamp');
        expect(result.block).to.have.property('previousBlock');
        expect(result.block).to.have.property('numberOfTransactions');
        expect(result.block).to.have.property('totalAmount');
        expect(result.block).to.have.property('totalFee');
        expect(result.block).to.have.property('reward');
        expect(result.block).to.have.property('payloadLength');
        expect(result.block).to.have.property('payloadHash');
        expect(result.block).to.have.property('generatorPublicKey');
        expect(result.block).to.have.property('generatorId');
        expect(result.block).to.have.property('blockSignature');
        expect(result.block).to.have.property('confirmations');
        expect(result.block).to.have.property('username');
        expect(result.block).to.have.property('totalForged');
        done();
      });

    });

  })

});
