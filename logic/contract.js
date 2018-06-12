

//Requiring Modules
let request = require('request');

// Private fields
let modules, self;

//Contract constructor initialized from modules/contracts.js's constructor
function Contract(config, cb) {
	self = this;
	self.scope = {
		config: config
	};

	if (cb) {
		return setImmediate(cb, null, this);
	}
}

//To be implemented as per requirement
Contract.prototype.create = function (data, trs) {
	return trs;
};

//To be implemented as per requirement
Contract.prototype.calculateFee = function () {
	return 0;
};

//To be implemented as per requirement
Contract.prototype.verify = function (trs, sender, cb) {
	setImmediate(cb, null, trs);
};

//To be implemented as per requirement
Contract.prototype.getBytes = function () {
	return null;
};

//To be implemented as per requirement
Contract.prototype.apply = function (trs, sender, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.undo = function (trs, sender, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.applyUnconfirmed = function (trs, sender, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.undoUnconfirmed = function (trs, sender, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.ready = function (trs, sender, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.save = function (trs, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.dbRead = function () {
	return null;
};
//To be implemented as per requirement
Contract.prototype.objectNormalize = function (asset, cb) {
	setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

//Calculate end time based on current timestamp
Contract.prototype.calcEndTime = function (accType, startTime) {
	let date = new Date(startTime * 1000);
	/*  if (accType == 1 || accType == 0) {
        let endTime = (date.setMinutes(date.getMinutes() + 90 * 24 * 60 * 60)) / 1000;
    } else if (accType == 2) {
        let endTime = (date.setMinutes(date.getMinutes() + 90 * 24 * 60 * 60)) / 1000;
    } else if (accType == 3) {
        let endTime = (date.setMinutes(date.getMinutes() + 365 * 24 * 60 * 60)) / 1000;
    } */
	let endTime = (date.setMinutes(date.getMinutes() + 2 ))/1000;
	return endTime;
};

//Contract will run to transfer amount to users after 3 months once the network up
Contract.prototype.sendContractAmount = function (data, cb) {
	data.forEach(function (recipient) {
		let sender = self.scope.config.users[recipient.accType];
		let port = self.scope.config.app.port;
		let address = self.scope.config.address;
		let url = 'http://' + address + ':' + port + '/api/transactions';
		//let secret = 'type_' + recipient.accType + '_secret';
		//let key = 'type_' + recipient.accType + '_key';
		let transactionData = {
			json: {
				secret: sender.secret,
				publicKey: sender.publicKey,
				amount: recipient.transferedAmount,
				recipientId: recipient.address
			}
		};

		//Request to Send Transaction
		request.put(url, transactionData, function (err, trsResponse, body) {
			if (!err && trsResponse.statusCode == 200) {
				return setImmediate(cb, null, body);
			} else {
				return setImmediate(cb, err);
			}
		});  
	});
};

//Bind modules. Initially bound accounts.js module
Contract.prototype.bind = function (accounts) {
	modules = {
		accounts: accounts,
	};
};

module.exports = Contract;