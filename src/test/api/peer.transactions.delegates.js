

let crypto = require('crypto');
let node = require('./../node.js');

let account = node.randomAccount();
let account2 = node.randomAccount();

function postTransaction (transaction, done) {
	node.post('/peer/transactions', {
		transaction: transaction
	}, function (err, res) {
		done(err, res);
	});
}

function sendDDK (params, done) {
	let transaction = node.ddk.transaction.createTransaction(params.recipientId, params.amount, params.secret);

	postTransaction(transaction, function (err, res) {
		node.expect(res.body).to.have.property('success').to.be.ok;
		node.onNewBlock(function (err) {
			done(err, res);
		});
	});
}

describe('POST /peer/transactions', function () {

	describe('registering a delegate', function () {

		it('using undefined transaction', function (done) {
			postTransaction(undefined, function (err, res) {
				node.expect(res.body).to.have.property('success').to.be.not.ok;
				node.expect(res.body).to.have.property('message').to.contain('Invalid transaction body');
				done();
			});
		});

		it('using undefined transaction.asset', function (done) {
			let transaction = node.ddk.delegate.createDelegate(node.randomPassword(), node.randomDelegateName().toLowerCase());
			transaction.fee = node.fees.delegateRegistrationFee;

			delete transaction.asset;

			postTransaction(transaction, function (err, res) {
				node.expect(res.body).to.have.property('success').to.be.not.ok;
				node.expect(res.body).to.have.property('message').to.contain('Invalid transaction body');
				done();
			});
		});

		describe('when account has no funds', function () {

			it('should fail', function (done) {
				let transaction = node.ddk.delegate.createDelegate(node.randomPassword(), node.randomDelegateName().toLowerCase());
				transaction.fee = node.fees.delegateRegistrationFee;

				postTransaction(transaction, function (err, res) {
					node.expect(res.body).to.have.property('success').to.be.not.ok;
					node.expect(res.body).to.have.property('message').to.match(/Account does not have enough LSK: [0-9]+L balance: 0/);
					done();
				});
			});
		});

		describe('when account has funds', function () {

			before(function (done) {
				sendDDK({
					secret: node.gAccount.password,
					amount: node.fees.delegateRegistrationFee,
					recipientId: account.address
				}, done);
			});

			it('using invalid username should fail', function (done) {
				let transaction = node.ddk.delegate.createDelegate(account.password, crypto.randomBytes(64).toString('hex'));
				transaction.fee = node.fees.delegateRegistrationFee;

				postTransaction(transaction, function (err, res) {
					node.expect(res.body).to.have.property('success').to.be.not.ok;
					done();
				});
			});

			it('using uppercase username should fail', function (done) {
				account.username = 'UPPER_DELEGATE';
				let transaction = node.ddk.delegate.createDelegate(account.password, account.username);

				postTransaction(transaction, function (err, res) {
					node.expect(res.body).to.have.property('success').to.be.not.ok;
					done();
				});
			});

			describe('when lowercased username already registered', function () {
				it('using uppercase username should fail', function (done) {
					let transaction = node.ddk.delegate.createDelegate(account2.password, account.username.toUpperCase());

					postTransaction(transaction, function (err, res) {
						node.expect(res.body).to.have.property('success').to.be.not.ok;
						done();
					});
				});
			});

			it('using lowercase username should be ok', function (done) {
				account.username = node.randomDelegateName().toLowerCase();
				let transaction = node.ddk.delegate.createDelegate(account.password, account.username);

				postTransaction(transaction, function (err, res) {
					node.expect(res.body).to.have.property('success').to.be.ok;
					node.expect(res.body).to.have.property('transactionId').to.equal(transaction.id);
					done();
				});
			});
		});

		describe('twice for the same account', function () {

			before(function (done) {
				sendDDK({
					secret: node.gAccount.password,
					amount: (node.fees.delegateRegistrationFee * 2),
					recipientId: account2.address
				}, done);
			});

			it('should fail', function (done) {
				account2.username = node.randomDelegateName().toLowerCase();
				let transaction = node.ddk.delegate.createDelegate(account2.password, account2.username);

				account2.username = node.randomDelegateName().toLowerCase();
				let transaction2 = node.ddk.delegate.createDelegate(account2.password, account2.username);

				postTransaction(transaction, function (err, res) {
					node.expect(res.body).to.have.property('success').to.be.ok;

					node.onNewBlock(function () {
						postTransaction(transaction2, function (err, res) {
							node.expect(res.body).to.have.property('success').to.be.not.ok;
							done();
						});
					});
				});
			});
		});
	});
});
