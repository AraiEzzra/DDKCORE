'use strict';

var constants = require('../helpers/constants.js');
var sql = require('../sql/frogings.js');
var slots = require('../helpers/slots.js');
var config = require('../config.json');
var request = require('request');
var async = require('async');

// Private fields
var __private = {};
__private.types = {};

// Private fields
var modules, library, self;

// Constructor
function SendFreezeOrder(logger, db, network, cb) {
	self = this;
	self.scope = {
		logger: logger,
		db: db,
		network: network
	};

	if (cb) {
		return setImmediate(cb, null, this);
	}
}


SendFreezeOrder.prototype.create = function (data, trs) {
	trs.startTime = trs.timestamp;
	var date = new Date(trs.timestamp * 1000);
	trs.nextMilestone = (date.setMinutes(date.getMinutes() + constants.froze.milestone)) / 1000;
	trs.endTime = (date.setMinutes(date.getMinutes() - constants.froze.milestone + constants.froze.endTime)) / 1000;
	trs.recipientId = data.recipientId;
	trs.frozeId = data.frozeId;
	trs.amount = parseInt(data.freezedAmount);
	return trs;
};

SendFreezeOrder.prototype.ready = function (frz, sender) {
	return true;
};


SendFreezeOrder.prototype.inactive = '0';
SendFreezeOrder.prototype.active = '1';

SendFreezeOrder.prototype.dbSave = function (trs) {
	return null;
};

SendFreezeOrder.prototype.dbRead = function (raw) {
	return null;
};

SendFreezeOrder.prototype.objectNormalize = function (trs) {
	delete trs.blockId;
	return trs;
};

SendFreezeOrder.prototype.undoUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
};

SendFreezeOrder.prototype.applyUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
};

SendFreezeOrder.prototype.undo = function (trs, block, sender, cb) {
	modules.accounts.setAccountAndGet({ address: trs.recipientId }, function (err, recipient) {
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

SendFreezeOrder.prototype.apply = function (trs, block, sender, cb) {
	modules.accounts.setAccountAndGet({ address: trs.recipientId }, function (err, recipient) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.accounts.mergeAccountAndGet({
			address: trs.recipientId,
			balance: trs.amount,
			u_balance: trs.amount,
			blockId: block.id,
			round: modules.rounds.calc(block.height)
		}, function (err) {
			return setImmediate(cb, err);
		});
		// modules.accounts.setAccountAndGet(data, cb);
		//return setImmediate(cb, null, trs);
	});
};

SendFreezeOrder.prototype.getBytes = function (trs) {
	return null;
};

SendFreezeOrder.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

SendFreezeOrder.prototype.verify = function (trs, sender, cb) {

	if (!trs.recipientId) {
		return setImmediate(cb, 'Missing recipient');
	}

	// if (trs.amount <= 0) {
	// 	return setImmediate(cb, 'Invalid transaction amount');
	// }

	return setImmediate(cb, null, trs);
};

SendFreezeOrder.prototype.calculateFee = function (trs, sender) {
	return constants.fees.sendfreeze;
};

SendFreezeOrder.prototype.bind = function (accounts, rounds) {
	modules = {
		accounts: accounts,
		rounds: rounds,
	};
};


SendFreezeOrder.prototype.sendFreezedOrder = function (data, cb) {

	function getActiveFrozeOrder() {
		return new Promise(function (resolve, reject) {
			self.scope.db.one(sql.getActiveFrozeOrder,
				{
					senderId: data.account.address,
					frozeId: data.req.body.frozeId
				}).then(function (row) {
					resolve(row)

				}).catch(function (err) {
					self.scope.logger.error(err.stack);

					if (err.name == "QueryResultError" && err.message == "No data returned from the query.") {
						reject('Selected order is expired. Please send active order.');
					} else {

						reject(new Error(err.toString()));
					}

				});


		});

	}

	function deductFrozeAmount(row) {
		return new Promise(function (resolve, reject) {
			//deduct froze Amount from totalFrozeAmount in mem_accounts table
			self.scope.db.none(sql.deductFrozeAmount,
				{
					senderId: data.account.address,
					FrozeAmount: row.freezedAmount
				}).then(function () {
					resolve();
				}).catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(cb, err.toString());
				});

		});

	}

	function updateFrozeAmount(row) {
		return new Promise(function (resolve, reject) {

			//update total Froze amount for recipient of froze order during sending order
			self.scope.db.none(sql.updateFrozeAmount,
				{
					senderId: data.req.body.recipientId,
					freezedAmount: row.freezedAmount
				}).then(function () {
					resolve();
				}).catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});

		});

	}

	function updateFrozeOrder(row) {
		return new Promise(function (resolve, reject) {

			//Update old freeze order
			self.scope.db.none(sql.updateFrozeOrder,
				{
					recipientId: data.req.body.recipientId,
					senderId: row.senderId,
					frozeId: data.req.body.frozeId
				}).then(function () {
					self.scope.logger.info("Successfully check for update froze order");
					resolve();
				}).catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});
		});

	}

	function createNewFrozeOrder(row) {
		return new Promise(function (resolve, reject) {

			//create new froze order according to send order
			self.scope.db.none(sql.createNewFrozeOrder,
				{
					frozeId: data.req.body.frozeId,
					startTime: row.startTime,
					nextMilestone: row.nextMilestone,
					endTime: row.endTime,
					senderId: data.req.body.recipientId,
					freezedAmount: row.freezedAmount,
					milestoneCount: row.milestoneCount

				}).then(function () {
					self.scope.logger.info("Successfully inserted new row in stake_orders table");
					resolve(row.freezedAmount);
				}).catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});

		});

	}


	async function sendFreezedOrder() {
		try {
			var row = await getActiveFrozeOrder();

			if (row) {
				self.scope.logger.info("Successfully get froze order");

				await deductFrozeAmount(row);
				await updateFrozeAmount(row);
				await updateFrozeOrder(row);
				await createNewFrozeOrder(row);
			}
			//Stake order event
			self.scope.network.io.sockets.emit('stake/change', null);
			
			return setImmediate(cb, null);
		} catch (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, err.toString());
		}

	};

	sendFreezedOrder();

};

// Export
module.exports = SendFreezeOrder
