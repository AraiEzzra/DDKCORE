const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_TRANSACTION', function () {

    let wsc;
    let transactions;

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

        it('Get transactions, used GET_TRANSACTIONS', function (done) {
            wsc.call('GET_TRANSACTIONS', { limit: 3 }, (result) => {
                expect(result).to.be.an('object');
                expect(result.transactions).to.be.an.instanceof(Array);
                transactions = result.transactions;
                done();
            });
        });

        it('should have valid parameters', function (done) {
            transactions.map((transaction, i) => {
                wsc.call('GET_TRANSACTION', { id: transaction.id }, (result) => {
                    expect(result).to.be.an('object');
                    expect(result.transaction).to.be.an('object');

                    expect(result.transaction).to.have.property('id');
                    expect(result.transaction).to.have.property('height');
                    expect(result.transaction).to.have.property('blockId');
                    expect(result.transaction).to.have.property('type');
                    expect(result.transaction).to.have.property('timestamp');
                    expect(result.transaction).to.have.property('senderPublicKey');
                    expect(result.transaction).to.have.property('senderId');
                    expect(result.transaction).to.have.property('recipientId');
                    expect(result.transaction).to.have.property('recipientPublicKey');
                    expect(result.transaction).to.have.property('amount');
                    expect(result.transaction).to.have.property('stakedAmount');
                    expect(result.transaction).to.have.property('stakeId');
                    expect(result.transaction).to.have.property('groupBonus');
                    expect(result.transaction).to.have.property('fee');
                    expect(result.transaction).to.have.property('signature');
                    expect(result.transaction).to.have.property('signatures');
                    expect(result.transaction).to.have.property('confirmations');
                    expect(result.transaction).to.have.property('asset');
                    expect(result.transaction).to.have.property('reward');
                    expect(result.transaction).to.have.property('pendingGroupBonus');

                    if (i === transactions.length - 1) {
                        done();
                    }
                });
            });
        });

    })

});
