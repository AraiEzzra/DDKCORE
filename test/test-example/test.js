// Root object
let node = {};
const modulesLoader = require('./common/initModule').modulesLoader;

//Adding Properties To Root Object
node.config = modulesLoader.config;
node.baseUrl = 'http://' + node.config.address + ':' + node.config.port;
node.supertest = require('supertest');
node.api = node.supertest(node.baseUrl);
node.gAccount = {
	address: '4995063339468361088E',
	publicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
	password: 'hen worry two thank unfair salmon smile oven gospel grab latin reason'
};
node.invalidAccount = {
	address: '4995063339468361099E',
	password: 'leave speed clog blast property almost present like ill ski merit barely'
};
node.debug = console.log;
node.version = node.config.version;
node.expect = require('chai').expect;
node.ddk = require('ddk-js');

// Abstract Request
function abstractRequest (options, done) {
	let request = node.api[options.verb.toLowerCase()](options.path);

	request.set('Accept', 'application/json');
	request.set('version', node.version);
	request.set('nethash', node.config.nethash);
	request.set('ip', '0.0.0.0');
	request.set('port', node.config.port);

	request.expect('Content-Type', /json/);
	request.expect(200);

	if (options.params) {
		request.send(options.params);
	}

	let verb = options.verb.toUpperCase();
	node.debug(['> Path:'.grey, verb, options.path].join(' '));
	if (verb === 'POST' || verb === 'PUT') {
		node.debug(['> Data:'.grey, JSON.stringify(options.params)].join(' '));
	}

	if (done) {
		request.end(function (err, res) {
			node.debug('> Response:'.grey, JSON.stringify(res.body));
			done(err, res);
		});
	} else {
		return request;
	}
}

// Returns a random number between min (inclusive) and max (exclusive)
node.randomNumber = function (min, max) {
	return	Math.floor(Math.random() * (max - min) + min);
};

// Returns a random delegate name
node.randomDelegateName = function () {
	let size = node.randomNumber(1, 20); // Min. delegate name size is 1, Max. delegate name is 20
	let delegateName = '';
	let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.';

	for (let i = 0; i < size; i++) {
		delegateName += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return delegateName;
};

// Returns a random password
node.randomPassword = function () {
	return Math.random().toString(36).substring(7);
};

// Returns a basic random account
node.randomAccount = function () {
	let account = {
		balance: '0'
	};

	account.password = node.randomPassword();
	account.secondPassword = node.randomPassword();
	account.username = node.randomDelegateName();
	account.publicKey = node.ddk.crypto.getKeys(account.password).publicKey;
	account.address = node.ddk.crypto.getAddress(account.publicKey);
	account.address = account.address.split('L')[0];
	account.address = 'DDK' + account.address;

	return account;
};

// Get to the given path
node.get = function (path, done) {
	return abstractRequest({ verb: 'GET', path: path, params: null }, done);
};

// Post to the given path
node.post = function (path, params, done) {
	return abstractRequest({ verb: 'POST', path: path, params: params }, done);
};

//Test Cases For POST /api/accounts/open
describe('POST /api/accounts/open', function () {
    
	function openAccount (params, done) {
		node.post('/api/accounts/open', params, done);
	}

	it('using known passphrase should be ok', function (done) {
		openAccount({
			secret: node.gAccount.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(node.gAccount.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.equal(null);
			node.expect(res.body.account).to.have.property('u_multisignatures').to.equal(null);
			done();
		});
	});

	it('using unknown passphrase should be ok', function (done) {
		let account = node.randomAccount();

		openAccount({
			secret: account.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(account.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(account.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.equal(null);
			node.expect(res.body.account).to.have.property('u_multisignatures').to.equal(null);
			done();
		});
	});

	it('using empty json should fail', function (done) {
		openAccount({}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Missing required property: secret');
			done();
		});
	});

	it('using invalid json should fail', function (done) {
		openAccount('{\'invalid\'}', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Missing required property: secret');
			done();
		});
	});

	it('using empty passphrase should fail', function (done) {
		openAccount({
			secret: ''
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});
});

//Test Cases For GET /api/accounts/getBalance?address=<address>
describe('GET /api/accounts/getBalance?address=<address>', function () {
    
	function getBalance (address, done) {
		node.get('/api/accounts/getBalance?address=' + address, done);
	}

	it('using known address should be ok', function (done) {
		getBalance(node.gAccount.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('balance').that.is.a('string');
			node.expect(res.body).to.have.property('unconfirmedBalance').that.is.a('string');
			done();
		});
	});

	it('using unknown address should be ok', function (done) {
		let account = node.randomAccount();
		getBalance(node.invalidAccount.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('balance').that.is.a('string');
			node.expect(res.body).to.have.property('unconfirmedBalance').that.is.a('string');
			done();
		});
	});

	it('using invalid address should fail', function (done) {
		getBalance('thisIsNOTADDKAddress', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.eql('Object didn\'t pass validation for format address: thisIsNOTADDKAddress');
			done();
		});
	});

	it('using empty address should fail', function (done) {
		getBalance('', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});
});

//Test Cases For GET /api/accounts/getPublicKey?address=<address>
describe('GET /api/accounts/getPublicKey?address=<address>', function () {
    
	function getPublicKey (address, done) {
		node.get('/api/accounts/getPublicKey?address=' + address, done);
	}

	it('using known address should be ok', function (done) {
		getPublicKey(node.gAccount.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			done();
		});
	});

	it('using unknown address should be ok', function (done) {
		let account = node.randomAccount();
		getPublicKey(node.invalidAccount.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.contain('Account not found');
			done();
		});
	});

	it('using invalid address should fail', function (done) {
		getPublicKey('thisIsNOTADDKAddress', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.contain('Object didn\'t pass validation for format address: thisIsNOTADDKAddress');
			done();
		});
	});

	it('using empty address should fail', function (done) {
		getPublicKey('', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});
});

//Test Cases For 
describe('GET /api/accounts/getPublicKey?address=', function () {
    
	function getPublicKey (address, done) {
		node.get('/api/accounts/getPublicKey?address=' + address, done);
	}

	it('using known address should be ok', function (done) {
		getPublicKey(node.gAccount.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			done();
		});
	});

	it('using unknown address should be ok', function (done) {
		let account = node.randomAccount();
		getPublicKey(account.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.contain('Account not found');
			done();
		});
	});

	it('using invalid address should fail', function (done) {
		getPublicKey('thisIsNOTADDKAddress', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.contain('Object didn\'t pass validation for format address: thisIsNOTADDKAddress');
			done();
		});
	});

	it('using empty address should fail', function (done) {
		getPublicKey('', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});
});

//Test Cases For POST /api/accounts/generatePublicKey    
describe('POST /api/accounts/generatePublicKey', function () {

	function generatePublicKey (params, done) {
		node.post('/api/accounts/generatePublicKey', params, done);
	}

	it('using known passphrase should be ok', function (done) {
		generatePublicKey({
			secret: node.gAccount.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			done();
		});
	});

	it('using unknown passphrase should be ok', function (done) {
		let account = node.randomAccount();
		generatePublicKey({
			secret: account.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('publicKey').to.equal(account.publicKey);
			done();
		});
	});

	it('using empty json should fail', function (done) {
		generatePublicKey({}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Missing required property: secret');
			done();
		});
	});

	it('using invalid json should fail', function (done) {
		generatePublicKey('{\'invalid\'}', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Missing required property: secret');
			done();
		});
	});

	it('using empty passphrase should fail', function (done) {
		generatePublicKey({
			secret: ''
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});
});

describe('GET /accounts', function () {
    
	function getAccounts (params, done) {
		node.get('/api/accounts?' + params, done);
	}

	it('using known address should be ok', function (done) {
		getAccounts('address=' + node.gAccount.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(node.gAccount.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.a('array');
			node.expect(res.body.account).to.have.property('u_multisignatures').to.a('array');
			done();
		});
	});

	it('using known address and empty publicKey should be ok', function (done) {
		getAccounts('address=' + node.gAccount.address + '&publicKey=', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(node.gAccount.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.a('array');
			node.expect(res.body.account).to.have.property('u_multisignatures').to.a('array');
			done();
		});
	});

	it('using known lowercase address should be ok', function (done) {
		getAccounts('address=' + node.gAccount.address.toLowerCase(), function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(node.gAccount.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.a('array');
			node.expect(res.body.account).to.have.property('u_multisignatures').to.a('array');
			done();
		});
	});

	it('using unknown address should fail', function (done) {
		let account = node.randomAccount();
		getAccounts('address=' + account.address, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.eql('Account not found');
			done();
		});
	});

	it('using invalid address should fail', function (done) {
		getAccounts('address=' + 'thisIsNOTADDKAddress', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Object didn\'t pass validation for format address: thisIsNOTADDKAddress');
			done();
		});
	});

	it('using empty address should fail', function (done) {
		getAccounts('address=', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});

	it('using known publicKey should be ok', function (done) {
		getAccounts('publicKey=' + node.gAccount.publicKey, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(node.gAccount.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.a('array');
			node.expect(res.body.account).to.have.property('u_multisignatures').to.a('array');
			done();
		});
	});

	it('using known publicKey and empty address should fail', function (done) {
		getAccounts('publicKey=' + node.gAccount.publicKey + '&address=', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.eql('String is too short (0 chars), minimum 1');
			done();
		});
	});

	it('using unknown publicKey should fail', function (done) {
		let account = node.randomAccount();
		getAccounts('publicKey=' + account.publicKey, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error').to.eql('Account not found');
			done();
		});
	});

	it('using invalid publicKey should fail', function (done) {
		getAccounts('publicKey=' + 'thisIsNOTADDKAccountPublicKey', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Object didn\'t pass validation for format publicKey: thisIsNOTADDKAccountPublicKey');
			done();
		});
	});

	it('using invalid publicKey (integer) should fail', function (done) {
		getAccounts('publicKey=' + '123', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Expected type string but found type integer');
			done();
		});
	});

	it('using empty publicKey should fail', function (done) {
		getAccounts('publicKey=', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Missing required property: address or publicKey');
			done();
		});
	});

	it('using empty publicKey and address should fail', function (done) {
		getAccounts('publicKey=&address=', function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('String is too short (0 chars), minimum 1');
			done();
		});
	});

	it('using known address and matching publicKey should be ok', function (done) {
		getAccounts('address=' + node.gAccount.address + '&publicKey=' + node.gAccount.publicKey, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('account').that.is.an('object');
			node.expect(res.body.account).to.have.property('address').to.equal(node.gAccount.address);
			node.expect(res.body.account).to.have.property('unconfirmedBalance').that.is.a('string');
			node.expect(res.body.account).to.have.property('balance').that.is.a('string');
			node.expect(res.body.account).to.have.property('publicKey').to.equal(node.gAccount.publicKey);
			node.expect(res.body.account).to.have.property('unconfirmedSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondSignature').to.equal(0);
			node.expect(res.body.account).to.have.property('secondPublicKey').to.equal(null);
			node.expect(res.body.account).to.have.property('multisignatures').to.a('array');
			node.expect(res.body.account).to.have.property('u_multisignatures').to.a('array');
			done();
		});
	});

	it('using known address and not matching publicKey should fail', function (done) {
		let account = node.randomAccount();
		getAccounts('address=' + node.gAccount.address + '&publicKey=' + account.publicKey, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			node.expect(res.body.error).to.contain('Account publicKey does not match address');
			done();
		});
	});
});
