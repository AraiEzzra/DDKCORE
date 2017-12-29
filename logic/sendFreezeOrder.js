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
	trs.nextMilestone = (date.setMinutes(date.getMinutes() + constants.froze.milestone))/1000;
	trs.endTime = (date.setMinutes(date.getMinutes() - constants.froze.milestone + constants.froze.endTime))/1000;
	trs.recipientId = data.recipientId;
	trs.frozeId = data.frozeId;
	return trs;
};

SendFreezeOrder.prototype.ready = function (frz, sender) {
	return true;
};


SendFreezeOrder.prototype.inactive= '0';
SendFreezeOrder.prototype.active= '1';

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

SendFreezeOrder.prototype.apply = function (trs, block, sender, cb) {
	// var data = {
	// 	address: sender.address
	// };

	// modules.accounts.setAccountAndGet(data, cb);
	return setImmediate(cb, null, trs);
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

	if (!trs.frozeId) {
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

				//Update nextMilesone in "stake_orders" table
				self.scope.db.none(sql.updateFrozeOrder,
					{
						recipientId: recipientId,
						senderId: senderId,
						frozeId: frozeId
					}).then(function () {
						console.log("Successfully check for update froze order");

						//change status and nextmilestone
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
								console.log("Successfully inserted new row in stake_orders table");
								return setImmediate(cb, null);
							}).catch(function (err) {
								self.scope.logger.error(err.stack);
								return setImmediate(cb, err.toString());
							});

					}).catch(function (err) {
						self.scope.logger.error(err.stack);
						return setImmediate(cb, err.toString());
					});
			} else {
				self.scope.logger.info("Not getting any froze order for sending");
			}

		}).catch(function (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, err.toString());
		});

};

// Export
module.exports = SendFreezeOrder
