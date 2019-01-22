const chai = require('chai');
const expect = require('chai').expect;
const node = require('../node.js');
const speakeasy = require('speakeasy');
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


const account = node.randomAccount();

describe('RPC method: OPEN_ACCOUNT', function () {

    let wsc;
    let callParams = {
        "secret": "3e7d2f3c262c707d436c5358303667457178397d405d72446e497268545e",
        "email": "testuser@mail.com"
    };

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
            wsc.call('OPEN_ACCOUNT', callParams, (result) => {
                expect(result).to.be.an('object');
                expect(result.account).to.be.an('object');
                expect(result.account).to.have.property('address');
                expect(result.account).to.have.property('unconfirmedBalance');
                expect(result.account).to.have.property('balance');
                expect(result.account).to.have.property('publicKey');
                expect(result.account).to.have.property('unconfirmedSignature');
                expect(result.account).to.have.property('secondSignature');
                expect(result.account).to.have.property('secondPublicKey');
                expect(result.account).to.have.property('multisignatures');
                expect(result.account).to.have.property('u_multisignatures');
                expect(result.account).to.have.property('token');
                done();
            });
        });
    })

});
