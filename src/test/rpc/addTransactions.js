const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: ADD_TRANSACTIONS', function () {

    let wsc;
    let transactionParams;

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

        transactionParams = {
            secret: null,
            publicKey: null,
            recipientId: null,
            multisigAccountPublicKey: null,
            secondSecret: null,
            transactionRefer: null,
            amount: null,
        };

        it('should have valid parameters', function (done) {

            wsc.call('ADD_TRANSACTIONS', transactionParams, (result) => {
                expect(result).to.be.an('object');
                done();
            });

        });

    })

});
