const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_PUBLICKEY', function () {

    const ADDRESS = 'DDK16313739661670634666';
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
            wsc.call('GET_PUBLICKEY', { address: ADDRESS }, (result) => {
                expect(result).to.be.an('object');
                expect(result.publicKey, 'publicKey not found').to.be.an('string');
                done();
            });
        });
    })

});
