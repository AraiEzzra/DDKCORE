const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_FEES', function () {

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
            wsc.call('GET_FEES', {}, (result) => {
                expect(result).to.be.an('object');
                expect(result.fees).to.be.an('object');

                expect(result.fees).to.have.property('send').to.be.an('number');
                expect(result.fees).to.have.property('vote').to.be.an('number');
                expect(result.fees).to.have.property('secondsignature').to.be.an('number');
                expect(result.fees).to.have.property('delegate').to.be.an('number');
                expect(result.fees).to.have.property('multisignature').to.be.an('number');
                expect(result.fees).to.have.property('dapp').to.be.an('number');
                expect(result.fees).to.have.property('froze').to.be.an('number');
                expect(result.fees).to.have.property('sendfreeze').to.be.an('number');
                expect(result.fees).to.have.property('reward').to.be.an('number');

                done();
            });
        });

    })

});
