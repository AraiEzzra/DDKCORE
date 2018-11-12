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
        expect(result).to.be.object;
        expect(result.account).to.be.object;
        accountResult = result;
        done();
      });
    });

  });

  describe('Checking the result on the conditions', function () {

    it('should not stop', function (done) {
      expect(accountResult.account.address).to.be.string;
      expect(accountResult.account.unconfirmedBalance).to.be.string;
      expect(accountResult.account.balance).to.be.string;
      expect(accountResult.account.publicKey).to.be.defined;
      done()
    });

  });

});
