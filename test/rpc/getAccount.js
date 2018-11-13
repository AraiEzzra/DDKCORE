const chai = require('chai');
const expect = require('chai').expect;
const WebSocket = require('rpc-websockets').Client;


describe('RPC method: GET_ACCOUNT', function () {

  const URL = 'ws://localhost:8080/v1';
  const ADDRESS = 'DDK7214959811294852078';
  let ws;
  let accountResult;

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

    it('should return object', function (done) {
      ws.call('GET_ACCOUNT', {address: ADDRESS}).then((result) => {
        expect(result).to.be.an('object');
        expect(result.account, 'prop account must be object').to.be.an('object');

        accountResult = result.account;
        done();
      });
    });

  });

  describe('Checking the result on the conditions', function () {

    it('should not stop', function (done) {
      expect(accountResult.address).to.be.an('string');
      expect(accountResult.unconfirmedBalance).to.be.an('string');
      expect(accountResult.balance).to.be.an('string');
      expect(accountResult).to.have.property('publicKey');
      expect(accountResult).to.have.property('unconfirmedSignature').to.be.an('number');
      expect(accountResult).to.have.property('secondSignature').to.be.an('number');
      expect(accountResult).to.have.property('secondPublicKey');
      expect(accountResult).to.have.property('multisignatures');
      expect(accountResult).to.have.property('totalFrozeAmount');
      done()
    });

  });

});
