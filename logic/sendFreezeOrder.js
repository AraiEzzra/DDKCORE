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
function SendFreezeOrder(logger, db, cb) {
	self = this;
	self.scope = {
		logger: logger,
		db: db
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
	trs.amount = data.amount;
	return trs;
};

SendFreezeOrder.prototype.ready = function (frz, sender) {
	if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
		if (!Array.isArray(trs.signatures)) {
			return false;
		}
		return trs.signatures.length >= sender.multimin;
	} else {
		return true;
	}
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

	if (trs.amount <= 0) {
		return setImmediate(cb, 'Invalid transaction amount');
	}

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

SendFreezeOrder.prototype.modifyFreezeBalance = function (data, cb) {

	//deduct froze Amount from totalFrozeAmount in mem_accounts table
	self.scope.db.none(sql.deductFrozeAmount,
		{
			senderId: data.senderId,
			FrozeAmount: data.freezedAmount
		}).then(function () {
			//update total Froze amount for recipient of froze order during sending order
			self.scope.db.none(sql.updateFrozeAmount,
				{
					senderId: data.recipientId,
					freezedAmount: data.freezedAmount
				}).then(function () {
					return setImmediate(cb, null);
				}).catch(function (err) {
					self.scope.logger.error(err.stack);
					return setImmediate(cb, err.toString());
				});
		}).catch(function (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, err.toString());
		});

};

SendFreezeOrder.prototype.sendFreezedOrder = function (data, cb) {

	var frozeId = data.req.body.frozeId;

	self.scope.db.one(sql.getActiveFrozeOrder,
		{
			senderId: data.account.address,
			frozeId: frozeId
		}).then(function (row) {
			if (row) {
				self.scope.logger.info("Successfully get froze order");

				var senderId = row.senderId;
				var recipientId = data.req.body.recipientId;
				var startTime = row.startTime;
				var nextMilestone = row.nextMilestone;
				var endTime = row.endTime;
				var freezedAmount = row.freezedAmount;
				var milestoneCount = row.milestoneCount;

				self.modifyFreezeBalance({
					senderId: senderId,
					recipientId: recipientId,
					freezedAmount: freezedAmount
				}, function (err) {
					if (err) {
						return setImmediate(cb, err);
					} else {

						//Update old freeze order
						self.scope.db.none(sql.updateFrozeOrder,
							{
								recipientId: recipientId,
								senderId: senderId,
								frozeId: frozeId
							}).then(function () {
								self.scope.logger.info("Successfully check for update froze order");


								//create new froze order according to send order
								self.scope.db.none(sql.createNewFrozeOrder,
									{
										frozeId: frozeId,
										startTime: startTime,
										nextMilestone: nextMilestone,
										endTime: endTime,
										senderId: recipientId,
										freezedAmount: freezedAmount,
										milestoneCount: milestoneCount

									}).then(function () {
										self.scope.logger.info("Successfully inserted new row in stake_orders table");
										return setImmediate(cb, null, freezedAmount);
									}).catch(function (err) {
										self.scope.logger.error(err.stack);
										return setImmediate(cb, err.toString());
									});

							}).catch(function (err) {
								self.scope.logger.error(err.stack);
								return setImmediate(cb, err.toString());
							});
					}
				});

			} else {
				self.scope.logger.info("Not getting any froze order for sending");
			}

		}).catch(function (err) {
			self.scope.logger.error(err.stack);

			if (err.name == "QueryResultError" && err.message == "No data returned from the query.") {
				return setImmediate(cb,'Selected order is expired. Please send active order.');
			} else {

				return setImmediate(cb, err.toString());
			}

		});

};

// Export
module.exports = SendFreezeOrder
