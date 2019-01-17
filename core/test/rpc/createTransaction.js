const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');
const transactionTypes = require('../../helpers/transactionTypes.js');


describe('RPC method: CREATE_TRANSACTIONS', function () {

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
            type: 'SEND',
            amount: 100,
            senderAddress: 'DDK00000000000000000001',
            requesterAddress: 'DDK00000000000000000002',
        };

        it('should have valid parameters', function (done) {

            wsc.call('CREATE_TRANSACTIONS', transactionParams, (result) => {
                expect(result).to.be.an('object');
                expect(result.transaction).to.have.property('amount');
                expect(result.transaction).to.have.property('senderPublicKey');
                expect(result.transaction).to.have.property('requesterPublicKey');
                expect(result.transaction).to.have.property('timestamp');
                expect(result.transaction).to.have.property('asset');
                expect(result.transaction).to.have.property('stakedAmount');
                expect(result.transaction).to.have.property('trsName');
                expect(result.transaction).to.have.property('groupBonus');
                expect(result.transaction).to.have.property('reward');
                expect(result.transaction).to.have.property('signature');
                expect(result.transaction).to.have.property('fee');
                console.log(result);
                done();
            });
        });

    })

});
