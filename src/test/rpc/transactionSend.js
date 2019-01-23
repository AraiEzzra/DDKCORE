const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


const transactionSend = {
    secret: "seed sock milk update focus rotate barely fade car face mechanic mercy",
    amount: 1000000000,
    recipientId: "DDK0000000000000000000",
    publicKey: null
};

describe('RPC method: TRANSACTION_SEND', function () {

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

            wsc.call('TRANSACTION_SEND', transactionSend, (result) => {
                expect(result).to.be.an('object');
                done();
            });

        });

    })

});
