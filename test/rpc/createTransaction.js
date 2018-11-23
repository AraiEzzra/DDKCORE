const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');
const transactionTypes = require('../../helpers/transactionTypes.js');


describe('RPC method: CREATE_TRANSACTIONS', function () {

  let wsc;
  let transactionParams;

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

    transactionParams = {
      type: transactionTypes.SEND,
      amount: 0,
      senderAddress: 'DDK16313739661670634666',
      requesterAddress: 'DDK16863581701775438665',
    };

    it('should have valid parameters', function (done) {

      wsc.call('CREATE_TRANSACTIONS', transactionParams, (result) => {
        expect(result).to.be.an('object');
        console.log(result);
        done();
      });

    });

  })

});
