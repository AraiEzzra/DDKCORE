const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_DELEGATES', function () {

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

      wsc.call('GET_DELEGATES', {}, (result) => {
        expect(result).to.be.an('object');
        expect(result.delegates).to.be.an.instanceof(Array);
        expect(result.totalCount).to.be.an('number');

        result.delegates.map((delegate) => {
          expect(delegate).to.have.property('username');
          expect(delegate).to.have.property('address');
          expect(delegate).to.have.property('publicKey');
          expect(delegate).to.have.property('vote');
          expect(delegate).to.have.property('url');
          expect(delegate).to.have.property('producedblocks');
          expect(delegate).to.have.property('missedblocks');
          expect(delegate).to.have.property('rate');
          expect(delegate).to.have.property('rank');
          expect(delegate).to.have.property('approval');
          expect(delegate).to.have.property('productivity');
        });
        done();
      });

    });

  })

});
