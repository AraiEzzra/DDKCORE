'use strict';

var constants = require('../helpers/constants.js');

// Private fields
var __private = {};
__private.types = {};

// Private fields
var modules, library;

// Constructor
function Frozen (logger, cb) {
  //To do
  this.scope = {
		logger: logger
	};
	if (cb) {
		return setImmediate(cb, null, this);
	}
}


Frozen.prototype.create = function (data, trs) {
	trs.startTime = trs.timestamp;
	var date = new Date(trs.timestamp * 1000);
	trs.endTime = (date.setMinutes(date.getMinutes() + 5))/1000;
	trs.recipientId = null;
	trs.freezedAmount = data.freezedAmount;
	trs.totalAmount = data.sender.balance;
	return trs;
};

Frozen.prototype.ready = function (frz, sender) {
	return true;
};

//Hotam Singh
Frozen.prototype.dbTable = 'stake_orders';

Frozen.prototype.dbFields = [
	"id",
	"type",
	"startTime",
	"endTime",
	"senderId",
	"recipientId",
	"freezedAmount" ,
	"totalAmount" 
];

Frozen.prototype.inactive= '0';
Frozen.prototype.active= '1';

Frozen.prototype.dbSave = function (trs) {
	//Hotam Singh
	return {
		table: this.dbTable,
		fields: this.dbFields,
		values: {
			id: trs.id,
			type: trs.type,
			startTime: trs.startTime,
			endTime : trs.endTime,
			senderId: trs.senderId,
			recipientId: trs.recipientId,
			freezedAmount: trs.freezedAmount,
            totalAmount : trs.totalAmount
		}
	};
};

Frozen.prototype.dbRead = function (raw) {
	return null;
};

Frozen.prototype.objectNormalize = function (trs) {
	delete trs.blockId;
	return trs;
};

Frozen.prototype.undoUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
};

Frozen.prototype.applyUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
};

Frozen.prototype.undo = function (trs, block, sender, cb) {
	modules.accounts.setAccountAndGet({address: trs.recipientId}, function (err, recipient) {
		if (err) {
			return setImmediate(cb, err);
		}

		modules.accounts.mergeAccountAndGet({
			address: trs.recipientId,
			balance: -trs.amount,
			u_balance: -trs.amount,
			blockId: block.id,
			round: modules.rounds.calc(block.height)
		}, function (err) {
			return setImmediate(cb, err);
		});
	});
};

Frozen.prototype.apply = function (trs, block, sender, cb) {
	// var data = {
	// 	address: sender.address
	// };

	// modules.accounts.setAccountAndGet(data, cb);
	return setImmediate(cb, null, trs);
};

Frozen.prototype.getBytes = function (trs) {
	return null;
};

Frozen.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

Frozen.prototype.verify = function (trs, sender, cb) {
/*
  if (!trs.recipientId) {
		return setImmediate(cb, 'Missing recipient');
	}
*/
	if (trs.amount < 0) {
		return setImmediate(cb, 'Invalid transaction amount');
	}

	return setImmediate(cb, null, trs);
};

Frozen.prototype.calculateFee = function (trs, sender) {
	return constants.fees.froze;
};

Frozen.prototype.bind = function (accounts, rounds) {
	modules = {
		accounts: accounts,
		rounds: rounds,
	};
};

// Export
module.exports = Frozen;
