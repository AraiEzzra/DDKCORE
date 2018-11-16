const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_DELEGATE', function () {

  let wsc;
  let delegates;

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

    it('Get all delegates, used GET_DELEGATES', function (done) {
      wsc.call('GET_DELEGATES', {}, (result) => {
        expect(result).to.be.an('object');
        expect(result.delegates).to.be.an.instanceof(Array);
        delegates = result.delegates;
        done();
      });
    });

    it('should have valid parameters', function (done) {

      delegates.map((delegate, i) => {
        expect(delegate).to.have.property('address');
        expect(delegate.address).to.be.an('string');

        wsc.call('GET_DELEGATE', {publicKey: delegate.publicKey}, (result) => {
          expect(result).to.be.an('object');
          expect(result.delegate).to.be.an('object');

          expect(result.delegate).to.have.property('username');
          expect(result.delegate).to.have.property('address');
          expect(result.delegate).to.have.property('publicKey');
          expect(result.delegate).to.have.property('vote');
          expect(result.delegate).to.have.property('url');
          expect(result.delegate).to.have.property('producedblocks');
          expect(result.delegate).to.have.property('missedblocks');
          expect(result.delegate).to.have.property('rate');
          expect(result.delegate).to.have.property('rank');
          expect(result.delegate).to.have.property('approval');
          expect(result.delegate).to.have.property('productivity');

          if (i === delegates.length - 1) {
            done();
          }
        });
      });
    });

  });

});
