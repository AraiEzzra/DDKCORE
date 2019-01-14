const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_BLOCKS_COUNT', function () {

    let wsc;

    before(function (done) {
        wsc = new TestWebSocketConnector();
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

        it('should return number', function (done) {
            wsc.call('GET_BLOCKS_COUNT', {}, (result) => {
                expect(result).to.be.an('object');
                expect(parseInt(result.count)).to.be.an('number');
                done();
            });
        });

    });

});
