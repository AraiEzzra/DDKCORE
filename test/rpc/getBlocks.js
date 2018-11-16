const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_BLOCKS', function () {

  const LIMIT = 3;
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

      wsc.call('GET_BLOCKS', {limit: LIMIT, sort: "height:desc"}, (result) => {
        expect(result).to.be.an('object');
        expect(result.blocks).to.be.an.instanceof(Array);

        result.blocks.map((block) => {
          expect(block).to.have.property('id');
          expect(block).to.have.property('height');
          expect(block).to.have.property('timestamp');
          expect(block).to.have.property('previousBlock');
          expect(block).to.have.property('numberOfTransactions');
          expect(block).to.have.property('totalAmount');
          expect(block).to.have.property('totalFee');
          expect(block).to.have.property('reward');
          expect(block).to.have.property('payloadLength');
          expect(block).to.have.property('payloadHash');
          expect(block).to.have.property('generatorPublicKey');
          expect(block).to.have.property('generatorId');
          expect(block).to.have.property('blockSignature');
          expect(block).to.have.property('confirmations');
          expect(block).to.have.property('username');
          expect(block).to.have.property('totalForged');
        });
        done();
      });

    });

  })

});
