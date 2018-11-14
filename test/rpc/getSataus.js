const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_STATUS', function () {

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

      wsc.call('GET_STATUS', {}, (result) => {
        expect(result).to.be.an('object');
        expect(result.broadhash).to.be.an('string').that.length(64);
        expect(result.epoch).to.be.an('string');
        expect(result.height).to.be.an('number');
        expect(result.fee).to.be.an('number');
        expect(result.milestone).to.be.an('number');
        expect(result.nethash).to.be.an('string').that.have.length(64);
        expect(result.reward).to.be.an('number');
        expect(result.supply).to.be.an('number');
        done();
      });

    });

  })

});
