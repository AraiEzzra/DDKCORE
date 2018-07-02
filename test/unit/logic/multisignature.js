let node = require('./../../node.js');
let ed = require('../../../helpers/ed');
let crypto = require('crypto');
let async = require('async');

let chai = require('chai');
let expect = require('chai').expect;
let sinon = require('sinon');
let _  = require('lodash');
let transactionTypes = require('../../../helpers/transactionTypes');
let constants = require('../../../helpers/constants');

let modulesLoader = require('../../common/initModule').modulesLoader;
let Transaction = require('../../../logic/transaction.js');
let Rounds = require('../../../modules/rounds.js');
let AccountLogic = require('../../../logic/account.js');
let AccountModule = require('../../../modules/accounts.js');

let Multisignature = require('../../../logic/multisignature.js');

let validPassword = 'robust weapon course unknown head trial pencil latin acid';
let validKeypair = ed.makeKeypair(crypto.createHash('sha256').update(validPassword, 'utf8').digest());

let validSender = {
	address: '16313739661670634666L',
	publicKey: 'c094ebee7ec0c50ebee32918655e089f6e1a604b83bcaa760293c61e0f18ab6f',
	password: 'wagon stock borrow episode laundry kitten salute link globe zero feed marble',
	balance: '10000000000000000'
};

let senderHash = crypto.createHash('sha256').update(validSender.password, 'utf8').digest();
let senderKeypair = ed.makeKeypair(senderHash);

let multiSigAccount1 = {
	balance: '0',
	password: 'jcja4vxibnw5dayk3xr',
	secondPassword: '0j64m005jyjj37bpdgqfr',
	username: 'LP',
	publicKey: 'bd6d0388dcc0b07ab2035689c60a78d3ebb27901c5a5ed9a07262eab1a2e9bd2',
	address: '5936324907841470379L'
};

let multiSigAccount2 = {
	address: '10881167371402274308L',
	publicKey: 'addb0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9',
	password: 'actress route auction pudding shiver crater forum liquid blouse imitate seven front',
	balance: '0',
	delegateName: 'genesis_100'
};

describe('multisignature', function () {

	let transaction;
	let multisignature;
	let trs;
	let sender;

	let attachMultiSigAsset = function (transaction, accountLogic, rounds, done) {
		modulesLoader.initModuleWithDb(AccountModule, function (err, __accountModule) {
			multisignature = new Multisignature(modulesLoader.scope.schema, modulesLoader.scope.network, transaction, modulesLoader.logger);
			multisignature.bind(__accountModule, rounds);
			transaction.attachAssetType(transactionTypes.MULTI, multisignature);
			done();
		}, {
			logic: {
				account: accountLogic,
				transaction: transaction
			}
		});
	};

	before(function (done) {
		async.auto({
			rounds: function (cb) {
				modulesLoader.initModule(Rounds, modulesLoader.scope,cb);
			},
			accountLogic: function (cb) {
				modulesLoader.initLogicWithDb(AccountLogic, cb);
			},
			transaction: ['accountLogic', function (result, cb) {
				modulesLoader.initLogicWithDb(Transaction, cb, {
					ed: require('../../../helpers/ed'),
					account: result.accountLogic
				});
			}]
		}, function (err, result) {
			transaction = result.transaction;
			transaction.bindModules(result);
			attachMultiSigAsset(transaction, result.accountLogic, result.rounds, done);
		});
	});

	beforeEach(function () {
		sender = _.cloneDeep(validSender);
	});

	describe('objectNormalize', function () {

		describe('min', function () {

			it('should return error when value is not an integer', function () {
				let min = '2';
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, 2);
				trs.asset.multisignature.min = min;

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Expected type integer but found type string');
			});

			it('should return error when value is a negative integer', function () {
				let min = -1;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, 2);
				trs.asset.multisignature.min = min;

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value -1 is less than minimum 1');
			});

			it('should return error when value is smaller than minimum acceptable value', function () {
				let min = constants.multisigConstraints.min.minimum - 1;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, min);

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value 0 is less than minimum 1');
			});

			it('should return error when value is greater than maximum acceptable value', function () {
				let min = constants.multisigConstraints.min.maximum + 1;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], 1, min);

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value 16 is greater than maximum 15');
			});

			it('should return error when value is an overflow number', function () {
				let min = Number.MAX_VALUE + 1;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], 1, 2);
				trs.asset.multisignature.min = min;

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value 1.7976931348623157e+308 is greater than maximum 15');
			});
		});

		describe('lifetime', function () {

			it('should return error when value is not an integer', function () {
				let lifetime = '2';
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], 1, 2);
				trs.asset.multisignature.lifetime = lifetime;

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Expected type integer but found type string');
			});

			it('should return error when value is smaller than minimum acceptable value', function () {
				let lifetime = node.constants.multisigConstraints.lifetime.minimum - 1;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], lifetime, 2);

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value 0 is less than minimum 1');
			});

			it('should return error when value is greater than maximum acceptable value', function () {
				let lifetime = node.constants.multisigConstraints.lifetime.maximum + 1;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], lifetime, 2);

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value 73 is greater than maximum 72');
			});

			it('should return error when value is an overflow number', function () {
				let lifetime = Number.MAX_VALUE;
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], 1, 2);
				trs.asset.multisignature.lifetime = lifetime;

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Value 1.7976931348623157e+308 is greater than maximum 72');
			});
		});

		describe('keysgroup', function () {

			it('should return error when it is not an array', function () {
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, [''], 1, 2);
				trs.asset.multisignature.keysgroup = '';

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Expected type array but found type string');
			});

			it('should return error when array length is smaller than minimum acceptable value', function () {
				let keysgroup = [];
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, keysgroup, 1, 2);

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Array is too short (0), minimum 1');
			});

			it('should return error when array length is greater than maximum acceptable value', function () {
				let keysgroup = Array.apply(null, Array(constants.multisigConstraints.keysgroup.maxItems + 1)).map(function () {
					return '+' + node.ddk.crypto.getKeys(node.randomPassword()).publicKey;
				});
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, keysgroup, 1, 2);

				expect(function () {
					multisignature.objectNormalize.call(transaction, trs);
				}).to.throw('Failed to validate multisignature schema: Array is too long (16), maximum 15');
			});
		});

		it('should return transaction when asset is valid', function () {
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, Array.apply(null, Array(10)).map(function () {
				return '+' + node.ddk.crypto.getKeys(node.randomPassword()).publicKey;
			}), 1, 2);

			expect(multisignature.objectNormalize(trs)).to.eql(trs);
		});
	});

	describe('verify', function () {

		describe('from transaction.verify tests', function () {

			it('should return error when multisignature keysgroup has an entry which does not start with + character', function (done) {
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], 1, 2);
				trs.senderId = node.gAccount.address;

				transaction.verify(trs, node.gAccount, function (err, trs) {
					expect(err).to.equal('Invalid math operator in multisignature keysgroup');
					done();
				});
			});

			it('should return error when multisignature keysgroup has an entry which is null', function (done) {
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, null], 1, 2);
				trs.senderId = node.gAccount.address;

				transaction.verify(trs, node.gAccount, function (err, trs) {
					expect(err).to.equal('Invalid member in keysgroup');
					done();
				});
			});

			it('should return error when multisignature keysgroup has an entry which is undefined', function (done) {
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, undefined], 1, 2);
				trs.senderId = node.gAccount.address;

				transaction.verify(trs, node.gAccount, function (err, trs) {
					expect(err).to.equal('Invalid member in keysgroup');
					done();
				});
			});

			it('should return error when multisignature keysgroup has an entry which is an integer', function (done) {
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, 12], 1, 2);
				trs.senderId = node.gAccount.address;

				transaction.verify(trs, node.gAccount, function (err, trs) {
					expect(err).to.equal('Invalid member in keysgroup');
					done();
				});
			});

			it('should be okay for valid transaction', function (done) {
				let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, 2);
				trs.senderId = node.gAccount.address;

				transaction.verify(trs, node.gAccount, function (err, trs) {
					expect(err).to.not.exist;
					done();
				});
			});
		});
	});

	describe('from multisignature.verify tests', function () {

		it('should return error when min value is smaller than minimum acceptable value', function (done) {
			let min = constants.multisigConstraints.min.minimum - 1;
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, 1);
			trs.asset.multisignature.min = min;

			multisignature.verify(trs, node.gAccount, function (err) {
				expect(err).to.equal('Invalid multisignature min. Must be between 1 and 15');
				done();
			});
		});

		it('should return error when min value is greater than maximum acceptable value', function (done) {
			let min = constants.multisigConstraints.min.maximum + 1;
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, min);

			multisignature.verify(trs, node.gAccount, function (err) {
				expect(err).to.equal('Invalid multisignature min. Must be between 1 and 15');
				done();
			});
		});

		it('should return error when multisignature keysgroup has an entry which does not start with + character', function (done) {
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '-' + multiSigAccount2.publicKey], 1, 2);
			trs.senderId = node.gAccount.address;

			multisignature.verify(trs, node.gAccount, function (err, trs) {
				expect(err).to.equal('Invalid math operator in multisignature keysgroup');
				done();
			});
		});

		it('should return error when multisignature keysgroup has an entry which is null', function (done) {
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, null], 1, 2);
			trs.senderId = node.gAccount.address;

			multisignature.verify(trs, node.gAccount, function (err, trs) {
				expect(err).to.equal('Invalid member in keysgroup');
				done();
			});
		});

		it('should return error when multisignature keysgroup has an entry which is undefined', function (done) {
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, undefined], 1, 2);
			trs.senderId = node.gAccount.address;

			multisignature.verify(trs, node.gAccount, function (err, trs) {
				expect(err).to.equal('Invalid member in keysgroup');
				done();
			});
		});

		it('should return error when multisignature keysgroup has an entry which is an integer', function (done) {
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, 12], 1, 2);
			trs.senderId = node.gAccount.address;

			multisignature.verify(trs, node.gAccount, function (err, trs) {
				expect(err).to.equal('Invalid member in keysgroup');
				done();
			});
		});

		it('should be okay for valid transaction', function (done) {
			let trs	= node.ddk.multisignature.createMultisignature(node.gAccount.password, null, ['+' + multiSigAccount1.publicKey, '+' + multiSigAccount2.publicKey], 1, 2);
			trs.senderId = node.gAccount.address;

			multisignature.verify(trs, node.gAccount, function (err, trs) {
				expect(err).to.not.exist;
				done();
			});
		});
	});
});
