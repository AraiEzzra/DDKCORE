const chai = require('chai');
const expect = require('chai').expect;
const TestWebSocketConnector = require('../common/TestWebSocketConnector.js');


describe('RPC method: GET_PEER', function () {

    let wsc;
    let peers;

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

        it('Get all peers', function (done) {
            wsc.call('GET_PEERS', {}, (result) => {
                expect(result).to.be.an('object');
                expect(result.peers).to.be.an('array');
                peers = result.peers;
                done();
            });
        });

        it('should have valid parameters', function (done) {
            peers.forEach((peer, i) => {
                wsc.call('GET_PEER', { ip: peer.ip, port: peer.port }, (result) => {
                    expect(result).to.be.an('object');
                    expect(result.success).to.equals(true);

                    expect(result.peer).to.have.property('ip');
                    expect(result.peer).to.have.property('port');
                    expect(result.peer).to.have.property('state');
                    expect(result.peer).to.have.property('os');
                    expect(result.peer).to.have.property('version');
                    expect(result.peer).to.have.property('dappid');
                    expect(result.peer).to.have.property('broadhash');
                    expect(result.peer).to.have.property('height');
                    expect(result.peer).to.have.property('clock');
                    expect(result.peer).to.have.property('updated');
                    expect(result.peer).to.have.property('nonce');

                    if (i === peers.length - 1) {
                        done();
                    }
                });
            });
        });

    })

});
