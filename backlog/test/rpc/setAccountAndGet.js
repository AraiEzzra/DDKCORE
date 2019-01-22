const chai = require('chai');
const expect = require('chai').expect;
const node = require('../node.js');
const speakeasy = require('speakeasy');
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


const account = node.randomAccount();

describe('RPC method: SET_ACCOUNT_AND_GET', function () {

    let wsc;
    const callParams = {
        publicKey: account.publicKey,
        username: 'TEST_' + account.username,
        u_username: 'TEST_' + account.username,
        balance: 0,
        u_balance: 0
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
            wsc.call('SET_ACCOUNT_AND_GET', callParams, (result) => {
                expect(result).to.be.an('object');
                done();
            });
        });
    })

});
