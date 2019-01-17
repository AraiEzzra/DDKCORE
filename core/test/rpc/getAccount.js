const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_ACCOUNT', function () {

    const ADDRESS = 'DDK7214959811294852078';
    let accountResult;
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

        it('should return object', function (done) {
            wsc.call('GET_ACCOUNT', { address: ADDRESS }, (result) => {
                expect(result).to.be.an('object');
                expect(result.account, 'prop account must be object').to.be.an('object');
                accountResult = result.account;
                done();
            });

        });

    });

    describe('Checking the result on the conditions', function () {

        it('should not stop', function (done) {
            expect(accountResult.address).to.be.an('string');
            expect(accountResult.unconfirmedBalance).to.be.an('string');
            expect(accountResult.balance).to.be.an('string');
            expect(accountResult).to.have.property('publicKey');
            expect(accountResult).to.have.property('unconfirmedSignature').to.be.an('number');
            expect(accountResult).to.have.property('secondSignature').to.be.an('number');
            expect(accountResult).to.have.property('secondPublicKey');
            expect(accountResult).to.have.property('multisignatures');
            expect(accountResult).to.have.property('totalFrozeAmount');
            done()
        });

    });

});
