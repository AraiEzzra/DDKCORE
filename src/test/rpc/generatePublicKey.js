const chai = require('chai');
const expect = require('chai').expect;
const speakeasy = require('speakeasy');
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GENERATE_PUBLICKEY', function () {

    const secret = speakeasy.generateSecret({ length: 30 });
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

        it('should return object with publicKey string', function (done) {
            wsc.call('GENERATE_PUBLICKEY', { secret: secret.hex }, (result) => {
                expect(result).to.be.an('object');
                expect(result.publicKey).to.be.an('string');
                done();
            });
        });

    });

});
