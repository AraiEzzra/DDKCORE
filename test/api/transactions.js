

let node = require('./../node.js');
let modulesLoader = require('./../common/initModule.js').modulesLoader;
let transactionSortFields = require('../../sql/transactions').sortFields;

let account = node.randomTxAccount();
let account2 = node.randomTxAccount();
let account3 = node.randomTxAccount();

let transactionList = [];
let offsetTimestamp = 0;

function openAccount (params, done) {
	node.post('/api/accounts/open', params, function (err, res) {
		done(err, res);
	});
}

function putTransaction (params, done) {
	node.put('/api/transactions', params, done);
}

function sendLISK (account, amount, done) {
	let expectedFee = node.expectedFee(amount);

	putTransaction({
		secret: node.gAccount.password,
		amount: amount,
		recipientId: account.address
	}, function (err, res) {
		node.expect(res.body).to.have.property('success').to.be.ok;
		node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
		transactionList.push({
			'sender': node.gAccount.address,
			'recipient': account.address,
			'grossSent': (amount + expectedFee) / node.normalizer,
			'fee': expectedFee / node.normalizer,
			'netSent': amount / node.normalizer,
			'txId': res.body.transactionId,
			'type': node.txTypes.SEND
		});
		done(err, res);
	});
}

before(function (done) {
	setTimeout(function () {
		sendLISK(account, node.randomLISK(), done);
	}, 2000);
});

before(function (done) {
	setTimeout(function () {
		sendLISK(account2, node.randomLISK(), done);
	}, 2000);
});

before(function (done) {
	setTimeout(function () {
		// Send 20 LSK
		sendLISK(account2, 20*100000000, done);
	}, 2000);
});

before(function (done) {
	setTimeout(function () {
		// Send 100 LSK
		sendLISK(account2, 100*100000000, done);
	}, 2000);
});

before(function (done) {
	node.onNewBlock(function (err) {
		done();
	});
});

describe('GET /api/transactions (cache)', function () {
	let cache;

	before(function (done) {
		node.config.cacheEnabled = true;
		done();
	});

	before(function (done) {
		modulesLoader.initCache(function (err, __cache) {
			cache = __cache;
			node.expect(err).to.not.exist;
			node.expect(__cache).to.be.an('object');
			return done(err, __cache);
		});
	});

	after(function (done) {
		cache.quit(done);
	});

	afterEach(function (done) {
		cache.flushDb(function (err, status) {
			node.expect(err).to.not.exist;
			node.expect(status).to.equal('OK');
			done(err, status);
		});
	});

	it('cache transactions by the url and parameters when response is a success', function (done) {
		let url, params;

		url = '/api/transactions?';
		params = [
			'blockId=' + '1',
			'senderId=' + node.gAccount.address,
			'recipientId=' + account.address,
		];

		node.get(url + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			let response = res.body;
			cache.getJsonForKey(url + params.join('&'), function (err, res) {
				node.expect(err).to.not.exist;
				node.expect(res).to.eql(response);
				done(err, res);
			});
		});
	});

	it('should not cache if response is not a success', function (done) {
		let url, params;
		url = '/api/transactions?';
		params = [
			'whatever:senderId=' + node.gAccount.address
		];

		node.get(url + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			cache.getJsonForKey(url + params, function (err, res) {
				node.expect(err).to.not.exist;
				node.expect(res).to.eql(null);
				done(err, res);
			});
		});
	});
});

describe('GET /api/transactions', function () {

	before(function (done) {
		node.onNewBlock(done);
	});

	it('using valid parameters should be ok', function (done) {
		let limit = 10;
		let offset = 0;
		let orderBy = 'amount:asc';

		let params = [
			'blockId=' + '1',
			'senderId=' + node.gAccount.address,
			'recipientId=' + account.address,
			'limit=' + limit,
			'offset=' + offset,
			'orderBy=' + orderBy
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body.transactions).to.have.length.within(transactionList.length, limit);
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].amount).to.be.at.most(res.body.transactions[i + 1].amount);
				}
			}
			done();
		});
	});

	it('using valid parameters with and/or should be ok', function (done) {
		let limit = 10;
		let offset = 0;
		let orderBy = 'amount:asc';

		let params = [
			'and:blockId=' + '1',
			'or:senderId=' + node.gAccount.address,
			'or:recipientId=' + account.address,
			'limit=' + limit,
			'offset=' + offset,
			'orderBy=' + orderBy
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body.transactions).to.have.length.within(transactionList.length, limit);
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].amount).to.be.at.most(res.body.transactions[i + 1].amount);
				}
			}
			done();
		});
	});

	it('using minAmount with and:maxAmount ordered by amount and limited should be ok', function (done) {
		let limit = 10;
		let offset = 0;
		let orderBy = 'amount:asc';
		let minAmount = 20*100000000; // 20 LSK
		let maxAmount = 100*100000000; // 100 LSK

		let params = [
			'minAmount=' + minAmount,
			'and:maxAmount=' + maxAmount,
			'limit=' + limit,
			'offset=' + offset,
			'orderBy=' + orderBy
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body.transactions).to.have.length.within(2, limit);
			node.expect(res.body.transactions[0].amount).to.be.equal(minAmount);
			node.expect(res.body.transactions[res.body.transactions.length-1].amount).to.be.equal(maxAmount);
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].amount).to.be.at.most(res.body.transactions[i + 1].amount);
				}
			}
			done();
		});
	});

	it('using valid parameters with/without and/or should be ok', function (done) {
		let limit = 10;
		let offset = 0;
		let orderBy = 'amount:asc';

		let params = [
			'and:blockId=' + '1',
			'or:senderId=' + node.gAccount.address,
			'or:recipientId=' + account.address,
			'fromHeight=' + 1,
			'toHeight=' + 666,
			'and:fromTimestamp=' + 0,
			'and:minAmount=' + 0,
			'limit=' + limit,
			'offset=' + offset,
			'orderBy=' + orderBy
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body.transactions).to.have.length.within(transactionList.length, limit);
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].amount).to.be.at.most(res.body.transactions[i + 1].amount);
				}
			}
			done();
		});
	});

	it('using valid array-like parameters should be ok', function (done) {
		let limit = 10;
		let offset = 0;
		let orderBy = 'amount:asc';

		let params = [
			'blockId=' + '1',
			'or:senderIds=' + node.gAccount.address + ',' + account.address,
			'or:recipientIds=' + account.address + ',' + account2.address,
			'or:senderPublicKeys=' + node.gAccount.publicKey,
			'or:recipientPublicKeys=' + node.gAccount.publicKey + ',' + account.publicKey,
			'limit=' + limit,
			'offset=' + offset,
			'orderBy=' + orderBy
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body.transactions).to.have.length.within(transactionList.length, limit);
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].amount).to.be.at.most(res.body.transactions[i + 1].amount);
				}
			}
			done();
		});
	});

	it('using one invalid field name with and/or should fail', function (done) {
		let limit = 10;
		let offset = 0;
		let orderBy = 'amount:asc';

		let params = [
			'and:blockId=' + '1',
			'or:senderId=' + node.gAccount.address,
			'or:whatever=' + account.address,
			'limit=' + limit,
			'offset=' + offset,
			'orderBy=' + orderBy
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using invalid condition should fail', function (done) {
		let params = [
			'whatever:senderId=' + node.gAccount.address
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using invalid field name (x:y:z) should fail', function (done) {
		let params = [
			'or:whatever:senderId=' + node.gAccount.address
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using empty parameter should fail', function (done) {
		let params = [
			'and:publicKey='
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using type should be ok', function (done) {
		let type = node.txTypes.SEND;
		let params = 'type=' + type;

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i]) {
					node.expect(res.body.transactions[i].type).to.equal(type);
				}
			}
			done();
		});
	});

	it('using no params should be ok', function (done) {
		node.get('/api/transactions', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].amount).to.be.at.least(res.body.transactions[i + 1].amount);
				}
			}
			done();
		});
	});

	it('using too small fromUnixTime should fail', function (done) {
		let params = 'fromUnixTime=1464109199';

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using too small toUnixTime should fail', function (done) {
		let params = 'toUnixTime=1464109200';

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using limit > 1000 should fail', function (done) {
		let limit = 1001;
		let params = 'limit=' + limit;

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('ordered by ascending timestamp should be ok', function (done) {
		let orderBy = 'timestamp:asc';
		let params = 'orderBy=' + orderBy;

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');

			let flag = 0;
			for (let i = 0; i < res.body.transactions.length; i++) {
				if (res.body.transactions[i + 1]) {
					node.expect(res.body.transactions[i].timestamp).to.be.at.most(res.body.transactions[i + 1].timestamp);
					if (flag === 0) {
						offsetTimestamp = res.body.transactions[i + 1].timestamp;
						flag = 1;
					}
				}
			}

			done();
		});
	});

	it('using offset == 1 should be ok', function (done) {
		let offset = 1;
		let params = 'offset=' + offset;

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			if (res.body.transactions.length > 0) {
				node.expect(res.body.transactions[0].timestamp).to.be.equal(offsetTimestamp);
			}
			done();
		});
	});

	it('using offset == "one" should fail', function (done) {
		let offset = 'one';
		let params = 'offset=' + offset;

		node.get('/api/transactions?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		 });
	});

	it('using completely invalid fields should fail', function (done) {
		let params = [
			'blockId=invalid',
			'senderId=invalid',
			'recipientId=invalid',
			'limit=invalid',
			'offset=invalid',
			'orderBy=invalid'
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using partially invalid fields should fail', function (done) {
		let params = [
			'blockId=invalid',
			'senderId=invalid',
			'recipientId=' + account.address,
			'limit=invalid',
			'offset=invalid',
			'orderBy=blockId:asc'
		];

		node.get('/api/transactions?' + params.join('&'), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using orderBy with any of sort fields should not place NULLs first', function (done) {
		node.async.each(transactionSortFields, function (sortField, cb) {
			node.get('/api/transactions?orderBy=' + sortField, function (err, res) {
				node.expect(res.body).to.have.property('success').to.be.ok;
				node.expect(res.body).to.have.property('transactions').that.is.an('array');

				let dividedIndices = res.body.transactions.reduce(function (memo, peer, index) {
					memo[peer[sortField] === null ? 'nullIndices' : 'notNullIndices'].push(index);
					return memo;
				}, {notNullIndices: [], nullIndices: []});

				if (dividedIndices.nullIndices.length && dividedIndices.notNullIndices.length) {
					let ascOrder = function (a, b) { return a - b; };
					dividedIndices.notNullIndices.sort(ascOrder);
					dividedIndices.nullIndices.sort(ascOrder);

					node.expect(dividedIndices.notNullIndices[dividedIndices.notNullIndices.length - 1])
						.to.be.at.most(dividedIndices.nullIndices[0]);
				}
				cb();
			});
		}, function () {
			done();
		});
	});
});

describe('GET /api/transactions/get?id=', function () {

	it('using valid id should be ok', function (done) {
		let transactionInCheck = transactionList[0];
		let params = 'id=' + transactionInCheck.txId;

		node.get('/api/transactions/get?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transaction').that.is.an('object');
			node.expect(res.body.transaction.id).to.equal(transactionInCheck.txId);
			node.expect(res.body.transaction.amount / node.normalizer).to.equal(transactionInCheck.netSent);
			node.expect(res.body.transaction.fee / node.normalizer).to.equal(transactionInCheck.fee);
			node.expect(res.body.transaction.recipientId).to.equal(transactionInCheck.recipient);
			node.expect(res.body.transaction.senderId).to.equal(transactionInCheck.sender);
			node.expect(res.body.transaction.type).to.equal(transactionInCheck.type);
			done();
		});
	});

	it('using invalid id should fail', function (done) {
		let params = 'id=invalid';

		node.get('/api/transactions/get?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});
});

describe('GET /api/transactions/count', function () {

	it('should be ok', function (done) {
		node.get('/api/transactions/count', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('confirmed').that.is.an('number');
			node.expect(res.body).to.have.property('queued').that.is.an('number');
			node.expect(res.body).to.have.property('multisignature').that.is.an('number');
			node.expect(res.body).to.have.property('unconfirmed').that.is.an('number');
			done();
		});
	});
});

describe('GET /api/transactions/queued/get?id=', function () {

	it('using unknown id should be ok', function (done) {
		let params = 'id=' + '1234';

		node.get('/api/transactions/queued/get?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.false;
			node.expect(res.body).to.have.property('error').that.is.equal('Transaction not found');
			done();
		});
	});
});

describe('GET /api/transactions/queued', function () {

	it('should be ok', function (done) {
		node.get('/api/transactions/queued', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body).to.have.property('count').that.is.an('number');
			done();
		});
	});
});

describe('GET /api/transactions/multisignatures/get?id=', function () {

	it('using unknown id should be ok', function (done) {
		let params = 'id=' + '1234';

		node.get('/api/transactions/multisignatures/get?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.false;
			node.expect(res.body).to.have.property('error').that.is.equal('Transaction not found');
			done();
		});
	});
});

describe('GET /api/transactions/multisignatures', function () {

	it('should be ok', function (done) {
		node.get('/api/transactions/multisignatures', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body).to.have.property('count').that.is.an('number');
			done();
		});
	});
});

describe('GET /api/transactions/unconfirmed/get?id=', function () {

	it('using valid id should be ok', function (done) {
		let params = 'id=' + transactionList[transactionList.length - 1].txId;

		node.get('/api/transactions/unconfirmed/get?' + params, function (err, res) {
			node.expect(res.body).to.have.property('success');
			if (res.body.success && res.body.transaction != null) {
				node.expect(res.body).to.have.property('transaction').that.is.an('object');
				node.expect(res.body.transaction.id).to.equal(transactionList[transactionList.length - 1].txId);
			} else {
				node.expect(res.body).to.have.property('error');
			}
			done();
		});
	});
});

describe('GET /api/transactions/unconfirmed', function () {

	it('should be ok', function (done) {
		node.get('/api/transactions/unconfirmed', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactions').that.is.an('array');
			node.expect(res.body).to.have.property('count').that.is.an('number');
			done();
		});
	});
});

describe('PUT /api/transactions', function () {

	it('using valid parameters should be ok', function (done) {
		let amountToSend = 100000000;
		let expectedFee = node.expectedFee(amountToSend);

		putTransaction({
			secret: account.password,
			amount: amountToSend,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
			transactionList.push({
				'sender': account.address,
				'recipient': account2.address,
				'grossSent': (amountToSend + expectedFee) / node.normalizer,
				'fee': expectedFee / node.normalizer,
				'netSent': amountToSend / node.normalizer,
				'txId': res.body.transactionId,
				'type': node.txTypes.SEND
			});
			done();
		});
	});

	it('using negative amount should fail', function (done) {
		let amountToSend = -100000000;

		putTransaction({
			secret: account.password,
			amount: amountToSend,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using float amount should fail', function (done) {
		let amountToSend = 1.2;

		putTransaction({
			secret: account.password,
			amount: amountToSend,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using entire balance should fail', function (done) {
		openAccount({ secret: account.password }, function (err, res) {
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			account.balance = res.body.account.balance;

			putTransaction({
				secret: account.password,
				amount: Math.floor(account.balance),
				recipientId: account2.address
			}, function (err, res) {
				node.expect(res.body).to.have.property('success').to.be.not.ok;
				node.expect(res.body).to.have.property('error').to.match(/Account does not have enough LSK: [0-9]+L balance: [0-9.]+/);
				done();
			});
		});
	});

	it('using zero amount should fail', function (done) {
		putTransaction({
			secret: account.password,
			amount: 0,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using positive overflown amount should fail', function (done) {
		putTransaction({
			secret: account.password,
			amount: 1298231812939123812939123912939123912931823912931823912903182309123912830123981283012931283910231203,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using negative overflown amount should fail', function (done) {
		putTransaction({
			secret: account.password,
			amount: -1298231812939123812939123912939123912931823912931823912903182309123912830123981283012931283910231203,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using small fractional amount should be ok', function (done) {
		putTransaction({
			secret: account.password,
			amount: 1,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transactionId');
			done();
		});
	});

	it('using no passphase should fail', function (done) {
		let amountToSend = 100000000;

		putTransaction({
			amount: amountToSend,
			recipientId: account2.address
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using no recipient should fail', function (done) {
		let amountToSend = 100000000;

		putTransaction({
			secret: account.password,
			amount: amountToSend
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	describe('to a cold address', function (done) {
		let recipientId = '13896491535841206186L';

		it('should be ok', function (done) {
			let amountToSend = 110000000;

			putTransaction({
				secret: node.gAccount.password,
				amount: amountToSend,
				recipientId: recipientId
			}, function (err, res) {
				node.expect(res.body).to.have.property('success').to.be.ok;
				done();
			});
		});
	});

	describe('from a cold address', function (done) {
		let passphrase = 'fiber diet blind uncover crunch breeze bicycle globe attack chalk cousin divert';

		before(function (done) {
			node.onNewBlock(done);
		});

		it('should be ok', function (done) {
			let amountToSend = 100000000;

			putTransaction({
				secret: passphrase,
				amount: amountToSend,
				recipientId: account2.address
			}, function (err, res) {
				node.expect(res.body).to.have.property('success').to.be.ok;
				done();
			});
		});
	});
});
