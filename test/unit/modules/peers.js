

let chai = require('chai');
let expect = require('chai').expect;
let express = require('express');
let sinon = require('sinon');
let randomString = require('randomstring');
let _  = require('lodash');

let config = process.env.NODE_ENV === 'development' ? require('../config/default') : process.env.NODE_ENV === 'testnet' ? require('../config/testnet') : require('../config/mainnet');
let randomPeer = require('../../common/objectStubs').randomPeer;
let modulesLoader = require('../../common/initModule').modulesLoader;

let currentPeers = [];

describe('peers', function () {

	let peers, modules;

	let NONCE = randomString.generate(16);

	function getPeers (cb) {
		peers.list({broadhash: config.nethash}, function (err, __peers) {
			expect(err).to.not.exist;
			expect(__peers).to.be.an('array');
			return cb(err, __peers);
		});
	}

	before(function (done) {
		modulesLoader.initAllModules(function (err, __modules) {
			if (err) {
				return done(err);
			}
			peers = __modules.peers;
			modules = __modules;
			peers.onBind(__modules);
			done();
		}, {nonce: NONCE});
	});

	beforeEach(function (done) {
		getPeers(function (err, __peers) {
			currentPeers = __peers;
			done();
		});
	});

	describe('sandboxApi', function (done) {

		it('should pass the call', function () {
			let sandboxHelper = require('../../../helpers/sandbox.js');
			sinon.stub(sandboxHelper, 'callMethod').returns(true);
			peers.sandboxApi();
			expect(sandboxHelper.callMethod.calledOnce).to.be.ok;
			sandboxHelper.callMethod.restore();
		});
	});

	describe('update', function () {

		it('should insert new peer', function (done) {
			peers.update(randomPeer);

			getPeers(function (err, __peers) {
				expect(currentPeers.length + 1).that.equals(__peers.length);
				currentPeers = __peers;
				let inserted = __peers.find(function (p) {
					return p.ip + ':' + p.port === randomPeer.ip + ':' + randomPeer.port;
				});
				expect(inserted).to.be.an('object');
				expect(inserted).not.to.be.empty;
				done();
			});
		});

		it('should update existing peer', function (done) {
			let toUpdate = _.clone(randomPeer);
			toUpdate.height += 1;
			peers.update(toUpdate);

			getPeers(function (err, __peers) {
				expect(currentPeers.length).that.equals(__peers.length);
				currentPeers = __peers;
				let updated = __peers.find(function (p) {
					return p.ip + ':' + p.port === randomPeer.ip + ':' + randomPeer.port;
				});
				expect(updated).to.be.an('object');
				expect(updated).not.to.be.empty;
				expect(updated.ip + ':' + updated.port).that.equals(randomPeer.ip + ':' + randomPeer.port);
				expect(updated.height).that.equals(toUpdate.height);
				done();
			});
		});

		it('should insert new peer if ip or port changed', function (done) {
			let toUpdate = _.clone(randomPeer);
			toUpdate.port += 1;
			peers.update(toUpdate);

			getPeers(function (err, __peers) {
				expect(currentPeers.length + 1).that.equals(__peers.length);
				currentPeers = __peers;
				let inserted = __peers.find(function (p) {
					return p.ip + ':' + p.port === toUpdate.ip + ':' + toUpdate.port;
				});
				expect(inserted).to.be.an('object');
				expect(inserted).not.to.be.empty;
				expect(inserted.ip + ':' + inserted.port).that.equals(toUpdate.ip + ':' + toUpdate.port);

				toUpdate.ip = '40.40.40.41';
				peers.update(toUpdate);
				getPeers(function (err, __peers) {
					expect(currentPeers.length + 1).that.equals(__peers.length);
					currentPeers = __peers;
					let inserted = __peers.find(function (p) {
						return p.ip + ':' + p.port === toUpdate.ip + ':' + toUpdate.port;
					});
					expect(inserted).to.be.an('object');
					expect(inserted).not.to.be.empty;
					expect(inserted.ip + ':' + inserted.port).that.equals(toUpdate.ip + ':' + toUpdate.port);
					done();
				});
			});
		});

		let ipAndPortPeer = {
			ip: '40.41.40.41',
			port: 4000
		};

		it('should insert new peer with only ip and port defined', function (done) {
			peers.update(ipAndPortPeer);

			getPeers(function (err, __peers) {
				expect(currentPeers.length + 1).that.equals(__peers.length);
				currentPeers = __peers;
				let inserted = __peers.find(function (p) {
					return p.ip + ':' + p.port === ipAndPortPeer.ip + ':' + ipAndPortPeer.port;
				});
				expect(inserted).to.be.an('object');
				expect(inserted).not.to.be.empty;
				expect(inserted.ip + ':' + inserted.port).that.equals(ipAndPortPeer.ip + ':' + ipAndPortPeer.port);
				done();
			});
		});

		it('should update peer with only one property defined', function (done) {
			peers.update(ipAndPortPeer);

			getPeers(function (err, __peers) {
				currentPeers = __peers;

				let almostEmptyPeer = _.clone(ipAndPortPeer);
				almostEmptyPeer.height = 1;

				peers.update(almostEmptyPeer);
				getPeers(function (err, __peers) {
					expect(currentPeers.length).that.equals(__peers.length);
					let inserted = __peers.find(function (p) {
						return p.ip + ':' + p.port === ipAndPortPeer.ip + ':' + ipAndPortPeer.port;
					});
					expect(inserted).to.be.an('object');
					expect(inserted).not.to.be.empty;
					expect(inserted.ip + ':' + inserted.port).that.equals(ipAndPortPeer.ip + ':' + ipAndPortPeer.port);
					expect(inserted.height).that.equals(almostEmptyPeer.height);
					done();
				});
			});
		});
	});

	describe('remove', function () {

		before(function (done) {
			peers.update(randomPeer);
			done();
		});

		it('should remove added peer', function (done) {
			getPeers(function (err, __peers) {
				currentPeers = __peers;
				let peerToRemove = currentPeers.find(function (p) {
					return p.ip + ':' + p.port === randomPeer.ip + ':' + randomPeer.port;
				});
				expect(peerToRemove).to.be.an('object').and.not.to.be.empty;
				expect(peerToRemove.state).that.equals(2);

				expect(peers.remove(peerToRemove.ip, peerToRemove.port)).to.be.ok;
				getPeers(function (err, __peers) {
					expect(currentPeers.length - 1).that.equals(__peers.length);
					currentPeers = __peers;
					done();
				});
			});
		});
	});

	describe('acceptable', function () {

		before(function () {
			process.env['NODE_ENV'] = 'DEV';
		});

		let ip = require('ip');

		it('should accept peer with public ip', function () {
			expect(peers.acceptable([randomPeer])).that.is.an('array').and.to.deep.equal([randomPeer]);
		});

		it('should not accept peer with private ip', function () {
			let privatePeer = _.clone(randomPeer);
			privatePeer.ip = '127.0.0.1';
			expect(peers.acceptable([privatePeer])).that.is.an('array').and.to.be.empty;
		});

		it('should not accept peer with ddk-js-api os', function () {
			let privatePeer = _.clone(randomPeer);
			privatePeer.os = 'ddk-js-api';
			expect(peers.acceptable([privatePeer])).that.is.an('array').and.to.be.empty;
		});

		it('should not accept peer with host\'s nonce', function () {
			let peer = _.clone(randomPeer);
			peer.nonce = NONCE;
			expect(peers.acceptable([peer])).that.is.an('array').and.to.be.empty;
		});

		it('should not accept peer with different ip but the same nonce', function () {
			process.env['NODE_ENV'] = 'TEST';
			let meAsPeer = {
				ip: '40.00.40.40',
				port: 4001,
				nonce: NONCE
			};
			expect(peers.acceptable([meAsPeer])).that.is.an('array').and.to.be.empty;
		});

		after(function () {
			process.env['NODE_ENV'] = 'TEST';
		});
	});

	describe('ping', function () {

		it('should accept peer with public ip', function (done) {
			sinon.stub(modules.transport, 'getFromPeer').callsArgWith(2, null, {
				success: true,
				peer: randomPeer,
				body: {
					success: true, height: randomPeer.height, peers: [randomPeer]
				}
			});

			peers.ping(randomPeer, function (err, res) {
				expect(modules.transport.getFromPeer.calledOnce).to.be.ok;
				expect(modules.transport.getFromPeer.calledWith(randomPeer)).to.be.ok;
				modules.transport.getFromPeer.restore();
				done();
			});
		});
	});

	describe('onBlockchainReady', function () {

		before(function () {
			modules.transport.onBind(modules);
		});

		it('should update peers during onBlockchainReady', function (done) {
			sinon.stub(peers, 'discover').callsArgWith(0, null);
			let config = process.env.NODE_ENV === 'development' ? require('../config/default') : process.env.NODE_ENV === 'testnet' ? require('../config/testnet') : require('../config/mainnet');
			let initialPeers = _.clone(config.peers.list);
			if (initialPeers.length === 0) {
				config.peers.list.push(randomPeer);
			}
			peers.onBlockchainReady();
			setTimeout(function () {
				expect(peers.discover.calledOnce).to.be.ok;
				peers.discover.restore();
				done();
			}, 100);
		});
	});

	describe('onPeersReady', function () {

		before(function () {
			modules.transport.onBind(modules);
		});

		it('should update peers during onBlockchainReady', function (done) {
			sinon.stub(peers, 'discover').callsArgWith(0, null);
			peers.onPeersReady();
			setTimeout(function () {
				expect(peers.discover.calledOnce).to.be.ok;
				peers.discover.restore();
				done();
			}, 100);
		});
	});
});
