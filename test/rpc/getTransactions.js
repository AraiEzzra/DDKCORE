const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_TRANSACTIONS', function () {

  const URL = 'ws://localhost:8080/v1';
  const TRX_LIMIT = 3;
  let wsc;

  before(function (done) {
    wsc = new TestWebSocketConnector(URL);
    wsc.open(done)
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

      wsc.call('GET_TRANSACTIONS', {limit: TRX_LIMIT}, (result) => {
        expect(result).to.be.an('object');
        expect(result.transactions).to.be.an.instanceof(Array);

        result.transactions.map((trx) => {

          expect(trx).to.have.property('id');
          expect(trx).to.have.property('height');
          expect(trx).to.have.property('blockId');
          expect(trx).to.have.property('type');
          expect(trx).to.have.property('timestamp');
          expect(trx).to.have.property('senderPublicKey');
          expect(trx).to.have.property('senderId');
          expect(trx).to.have.property('recipientId');
          expect(trx).to.have.property('recipientPublicKey');
          expect(trx).to.have.property('amount');
          expect(trx).to.have.property('stakedAmount');
          expect(trx).to.have.property('stakeId');
          expect(trx).to.have.property('groupBonus');
          expect(trx).to.have.property('fee');
          expect(trx).to.have.property('signature');
          expect(trx).to.have.property('signatures');
          expect(trx).to.have.property('confirmations');
          expect(trx).to.have.property('asset');
          expect(trx).to.have.property('reward');
          expect(trx).to.have.property('recipientName');

          expect(parseInt(trx.id)).to.be.an('number');
          expect(parseInt(trx.height)).to.be.an('number');
          expect(parseInt(trx.blockId)).to.be.an('number');
          expect(trx.type).to.be.an('number');
          expect(trx.timestamp).to.be.an('number');
          expect(trx.senderPublicKey).to.be.an('string').that.length(64);
          expect(trx.senderId).to.be.an('string');
          expect(trx.recipientId).to.be.an('string');
          expect(trx.recipientPublicKey, 'String with 64 charts').to.be.an('string').that.length(64);
          expect(trx.amount).to.be.an('number');
          expect(trx.stakedAmount).to.be.an('number');
          expect(trx.fee).to.be.an('number');
          expect(trx.signature).to.be.an('string').that.length(128);
          expect(trx.signatures).to.be.an('array');
          expect(trx.asset).to.be.an('object');
          expect(trx.recipientName).to.be.an('string');
        });
        done();
      });
    });

  });

});
