

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
	trs.recipientId = data.recipientId;
	trs.stakeId = data.stakeId;
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
	return (trs.amount * constants.fees.sendfreeze)/100;
};

SendFreezeOrder.prototype.bind = function (accounts, rounds) {
	modules = {
		accounts: accounts,
		rounds: rounds,
	};
};


SendFreezeOrder.prototype.sendFreezedOrder = function (userAndOrderData, cb) {

	function getActiveFrozeOrder() {
		return new Promise(function (resolve, reject) {
			self.scope.db.one(sql.getActiveFrozeOrder,
				{
					senderId: userAndOrderData.account.address,
					stakeId: userAndOrderData.stakeId
				})
				.then(function (order) {
					resolve(order)
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);

					if (err.code == 0 && err.message == "No data returned from the query.") {
						reject('Selected order is expired. Please send active order.');
					} else {
						reject(new Error(err.toString()));
					}
				});
		});
	}

	function deductFrozeAmount(order) {
		return new Promise(function (resolve, reject) {
			//deduct froze Amount from totalFrozeAmount in mem_accounts table
			self.scope.db.none(sql.deductFrozeAmount,
				{
					senderId: userAndOrderData.account.address,
					FrozeAmount: order.freezedAmount
				})
				.then(function () {
					resolve();
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});
		});
	}

	function updateFrozeAmount(order) {
		return new Promise(function (resolve, reject) {

			//update total Froze amount for recipient of froze order during sending order
			self.scope.db.none(sql.updateFrozeAmount,
				{
					senderId: userAndOrderData.recipientId,
					freezedAmount: order.freezedAmount
				})
				.then(function () {
					resolve();
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});
		});
	}

	function updateFrozeOrder(order) {
		return new Promise(function (resolve, reject) {

			//Update old freeze order
			self.scope.db.none(sql.updateFrozeOrder,
				{
					recipientId: userAndOrderData.recipientId,
					senderId: order.senderId,
					stakeId: userAndOrderData.stakeId
				})
				.then(function () {
					self.scope.logger.info("Successfully check for update froze order");
					resolve();
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});
		});
	}

	function createNewFrozeOrder(order) {
		return new Promise(function (resolve, reject) {

			//create new froze order according to send order
			self.scope.db.none(sql.createNewFrozeOrder,
				{
					id: order.id,
					startTime: order.startTime,
					insertTime: order.insertTime,
					senderId: userAndOrderData.recipientId,
					freezedAmount: order.freezedAmount,
					rewardCount: order.rewardCount,
					voteCount: order.voteCount,
					nextVoteMilestone: order.nextVoteMilestone,
					isVoteDone: order.isVoteDone

				})
				.then(function () {
					self.scope.logger.info("Successfully inserted new row in stake_orders table");
					resolve(order.freezedAmount);
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					reject(new Error(err.toString()));
				});
		});
	}

	//This async function take active froze order from table and deduct froze amount and update froze 
	//amount in mem_account table & update old order and create new order in stake table
	(async function() {
		try {
			var order = await getActiveFrozeOrder();

			if (order && order.isTransferred) {
				return setImmediate(cb, 'Order can be send only Once');
			} else {
				self.scope.logger.info("Successfully get froze order" + JSON.stringify(order));

				await deductFrozeAmount(order);
				await updateFrozeAmount(order);
				await updateFrozeOrder(order);
				await createNewFrozeOrder(order);
			}
			//Stake order event
			self.scope.network.io.sockets.emit('stake/change', null);
			
			return setImmediate(cb, null);
		} catch (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, err.toString());
		}

	})();

};

// Export
module.exports = SendFreezeOrder
