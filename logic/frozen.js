'use strict';

var constants = require('../helpers/constants.js');
var sql = require('../sql/frogings.js');
var slots = require('../helpers/slots.js');

var request = require('request');
var async = require('async');
var Promise = require('bluebird');

// Private fields
var __private = {};
__private.types = {};

// Private fields
var modules, library, self;

// Constructor
function Frozen(logger, db, transaction, network, config, cb) {
	self = this;
	self.scope = {
		logger: logger,
		db: db,
		logic: {
			transaction: transaction
		},
		network: network,
		config: config
	};
	
	if (cb) {
		return setImmediate(cb, null, this);
	}
}


Frozen.prototype.create = function (data, trs) {
	trs.startTime = trs.timestamp;
	var date = new Date(trs.timestamp * 1000);
	trs.nextMilestone = (date.setMinutes(date.getMinutes() + constants.froze.milestone))/1000;
	trs.endTime = (date.setMinutes(date.getMinutes() - constants.froze.milestone + constants.froze.endTime))/1000;
	trs.recipientId = null;
	trs.freezedAmount = data.freezedAmount;
	return trs;
};

Frozen.prototype.ready = function (frz, sender) {
	return true;
};

//Hotam Singh
Frozen.prototype.dbTable = 'stake_orders';

Frozen.prototype.dbFields = [
	"id",
	"status",
	"startTime",
	"nextMilestone",
	"endTime",
	"senderId",
	"recipientId",
	"freezedAmount" 
];

Frozen.prototype.inactive= '0';
Frozen.prototype.active= '1';

Frozen.prototype.dbSave = function (trs) {
	return {
		table: this.dbTable,
		fields: this.dbFields,
		values: {
			id: trs.id,
			status: this.active,
			startTime: trs.startTime,
			nextMilestone: trs.nextMilestone,
			endTime : trs.endTime,
			senderId: trs.senderId,
			recipientId: trs.recipientId,
			freezedAmount: trs.freezedAmount
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

Frozen.prototype.checkFrozeOrders = function () {
	 
	function frozeBenefit() {
		self.scope.db.query(sql.frozeBenefit,
			{
				milestone: constants.froze.milestone * 60,
				currentTime: slots.getTime()
			}).then(function (rows) {
				self.scope.logger.info("Successfully get :" + rows.length + ", number of froze order");
				return rows;

			}).catch(function (err) {
				self.scope.logger.error(err.stack);
			});

	}

   function checkAndUpdateMilestone(rows) {
	if (rows.length > 0) {
		//emit Stake order event when milestone change
		self.scope.network.io.sockets.emit('milestone/change', null);

		//Update nextMilesone in "stake_orders" table
		self.scope.db.none(sql.checkAndUpdateMilestone,
			{
				milestone: constants.froze.milestone * 60,
				currentTime: slots.getTime()
			}).then(function () {

				//change status and nextmilestone
				self.scope.db.none(sql.disableFrozeOrders,
					{
						currentTime: slots.getTime(),
						totalMilestone: totalMilestone
					}).then(function () {
						self.scope.logger.info("Successfully check status for disable froze orders");

					}).catch(function (err) {
						self.scope.logger.error(err.stack);
					});

			}).catch(function (err) {
				self.scope.logger.error(err.stack);
			});
	}

	for (i = 0; i < rows.length; i++) {

		if (rows[i].nextMilestone === rows[i].endTime) {
			self.scope.db.none(sql.deductFrozeAmount, {
				FrozeAmount: rows[i].freezedAmount,
				senderId: rows[i].senderId
			}).then(function () {
				self.scope.logger.info("Successfully check and if applicable, deduct froze amount from mem_account table");

			}).catch(function (err) {
				self.scope.logger.error(err.stack);
			});
		}

		//Request to send tarnsaction
		var transactionData = {
			json: {
				secret: config.users[0].secret,
				amount: parseInt(rows[i].freezedAmount * constants.froze.reward),
				recipientId: rows[i].senderId,
				publicKey: config.users[0].publicKey
			}
		};
		//Send froze monthly rewards to users
		self.scope.logic.transaction.sendTransaction(transactionData);
	}
}

	async function checkFrozeOrders() {
		var i;
		var totalMilestone = constants.froze.endTime / constants.froze.milestone;

		
	  
		var rows=await frozeBenefit();
		 await checkAndUpdateMilestone(rows);
		
		
	};
	checkFrozeOrders();
	

	
};

//Navin: Update Froze amount into mem_accounts table on every single order
Frozen.prototype.updateFrozeAmount = function (data, cb) {

	self.scope.db.one(sql.getFrozeAmount, {
		senderId: data.account.address
	}).then(function (row) {
		if (row.count === 0) {
			return setImmediate(cb, 'There is no Froze Amount ');
		}
		var frozeAmountFromDB = row.totalFrozeAmount;
		var totalFrozeAmount = parseInt(frozeAmountFromDB) + parseInt(data.req.body.freezedAmount);
		var totalFrozeAmountWithFees = totalFrozeAmount + parseInt(constants.fees.froze);
		//verify that freeze order cannot more than available balance
		if (totalFrozeAmountWithFees < data.account.balance) {
			self.scope.db.none(sql.updateFrozeAmount, {
				freezedAmount: data.req.body.freezedAmount,
				senderId: data.account.address
			}).then(function () {
				self.scope.logger.info(data.account.address + ': is update its froze amount in mem_accounts table ');
				return setImmediate(cb, null);
			}).catch(function (err) {
				self.scope.logger.error(err.stack);
				return setImmediate(cb, err.toString());
			});
		} else {
			return setImmediate(cb, 'Not have enough balance');
		}
	}).catch(function (err) {
		self.scope.logger.error(err.stack);
		return setImmediate(cb, err.toString());
	});



};

// Export
module.exports = Frozen;
