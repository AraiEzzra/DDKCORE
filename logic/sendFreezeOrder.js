let constants = require('../helpers/constants.js');
let sql = require('../sql/frogings.js');
let async = require('async');

// Private fields
let __private = {};
__private.types = {};

// Private fields
let modules, self;

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
	trs.trsName = "SENDSTAKE";
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

	async.series({
		addFrozeAmount: function (seriesCb) {
			//Add frozeAmount to mem_account to sender address
			self.scope.db.none(sql.deductFrozeAmount,
				{
					senderId: sender.address,
					FrozeAmount: -trs.amount
				})
				.then(function () {
					return setImmediate(seriesCb);
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					return setImmediate(seriesCb, err.toString());
				});
		},

		removeFrozeAmount: function (seriesCb) {

			//remove frozeAmount to mem_account to recipient address
			self.scope.db.none(sql.deductFrozeAmount,
				{
					senderId: trs.recipientId,
					FrozeAmount: trs.amount
				})
				.then(function () {
					return setImmediate(seriesCb);
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					return setImmediate(seriesCb, err.toString());
				});
		},
		rollbackOrders: function (seriesCb) {

			async.waterfall([
				function (waterCb) {
					self.scope.db.one(sql.getOldOrderID,
						{
							stakeId: trs.stakeId
						})
						.then(function (id) {
							return setImmediate(waterCb, null, id);
						})
						.catch(function (err) {
							self.scope.logger.error(err.stack);
							return setImmediate(waterCb, err.toString());
						});
				},
				function (id, waterCb) {
					self.scope.db.one(sql.getNewOrderNextVoteMilestone,
						{
							id: id,
							senderId: trs.recipientId
						})
						.then(function (nextVoteMilestone) {
							return setImmediate(waterCb, null, id, nextVoteMilestone);
						})
						.catch(function (err) {
							self.scope.logger.error(err.stack);
							return setImmediate(waterCb, err.toString());
						});
				},
				function (id, nextVoteMilestone, waterCb) {
					self.scope.db.one(sql.updateOldOrder,
						{
							stakeId: trs.stakeId,
							nextVoteMilestone: nextVoteMilestone
						})
						.then(function (nextVoteMilestone) {
							return setImmediate(waterCb, null, id);
						})
						.catch(function (err) {
							self.scope.logger.error(err.stack);
							return setImmediate(waterCb, err.toString());
						});
				},
				function (id, waterCb) {
					self.scope.db.one(sql.RemoveOrder,
						{
							id: id,
							senderId: trs.recipientId
						})
						.then(function (nextVoteMilestone) {
							return setImmediate(waterCb, null, nextVoteMilestone);
						})
						.catch(function (err) {
							self.scope.logger.error(err.stack);
							return setImmediate(waterCb, err.toString());
						});
				}
			], function (err) {
				if (err) {
					self.scope.logger.warn(err);
					return setImmediate(seriesCb, err);
				}
				return setImmediate(seriesCb, null);
			});
		}

	}, function (err) {
		if (err) {
			self.scope.logger.warn(err);
			return setImmediate(cb, err);
		}

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

	});
};

SendFreezeOrder.prototype.apply = function (trs, block, sender, cb) {

	async.waterfall([
		function (waterCb) {
			modules.accounts.setAccountAndGet({ address: trs.recipientId }, function (err) {
				if (err) {
					return setImmediate(waterCb, err);
				}

				modules.accounts.mergeAccountAndGet({
					address: trs.recipientId,
					balance: trs.amount,
					u_balance: trs.amount,
					blockId: block.id,
					round: modules.rounds.calc(block.height)
				}, function (err) {
					return setImmediate(waterCb, err);
				});
			});
		},
		function (waterCb) {

			self.getActiveFrozeOrder({
				address: trs.senderId,
				stakeId: trs.stakeId
			}, function (err, order) {
				if (err) {
					return setImmediate(waterCb, err);
				}
				return setImmediate(waterCb, null, order);
			});

		},
		function (order, waterCb) {

			self.sendFreezedOrder({
				senderId: trs.senderId,
				recipientId: trs.recipientId,
				stakeId: trs.stakeId,
				stakeOrder: order
			}, function (err) {

				if (err) {
					return setImmediate(waterCb, err);
				}
				return setImmediate(waterCb, null);
			});
		}

	], function (err) {
		return setImmediate(cb, err);
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

	if ((trs.fee) > (sender.balance - parseInt(sender.totalFrozeAmount))) {
		return setImmediate(cb, 'Insufficient balance');
	}

	return setImmediate(cb, null, trs);
};

SendFreezeOrder.prototype.calculateFee = function (trs, sender) {
	return (trs.amount * constants.fees.sendfreeze) / 100;
};

SendFreezeOrder.prototype.bind = function (accounts, rounds) {
	modules = {
		accounts: accounts,
		rounds: rounds,
	};
};

SendFreezeOrder.prototype.getActiveFrozeOrder = function (userData, cb) {

	self.scope.db.one(sql.getActiveFrozeOrder,
		{
			senderId: userData.address,
			stakeId: userData.stakeId
		})
		.then(function (order) {
			return setImmediate(cb, null, order);
		})
		.catch(function (err) {
			self.scope.logger.error(err.stack);

			if (err.code == 0 && err.message == "No data returned from the query.") {
				return setImmediate(cb, 'Selected order is expired. Please send active order.');
			} else {
				return setImmediate(cb, err.toString());
			}
		});
}

SendFreezeOrder.prototype.sendFreezedOrder = function (userAndOrderData, cb) {

    //This function take active froze order from table and deduct froze amount and update froze 
	//amount in mem_account table & update old order and create new order in stake table

	let order = userAndOrderData.stakeOrder;
	if (order) {
		//Stake order event
		self.scope.network.io.sockets.emit('stake/change', null);

		async.series({
			deductFrozeAmount: function (seriesCb) {
				//deduct froze Amount from totalFrozeAmount in mem_accounts table
				self.scope.db.none(sql.deductFrozeAmount,
					{
						senderId: userAndOrderData.senderId,
						FrozeAmount: order.freezedAmount
					})
					.then(function () {
						return setImmediate(seriesCb);
					})
					.catch(function (err) {
						self.scope.logger.error(err.stack);
						return setImmediate(seriesCb, err.toString());
					});
			},
			updateFrozeAmount: function (seriesCb) {
				//update total Froze amount for recipient of froze order during sending order
				self.scope.db.none(sql.updateFrozeAmount,
					{
						senderId: userAndOrderData.recipientId,
						freezedAmount: order.freezedAmount
					})
					.then(function () {
						return setImmediate(seriesCb);
					})
					.catch(function (err) {
						self.scope.logger.error(err.stack);
						return setImmediate(seriesCb, err.toString());
					});
			},
			updateFrozeOrder: function (seriesCb) {
				//Update old freeze order
				self.scope.db.none(sql.updateFrozeOrder,
					{
						recipientId: userAndOrderData.recipientId,
						senderId: order.senderId,
						stakeId: userAndOrderData.stakeId
					})
					.then(function () {
						self.scope.logger.info("Successfully check for update froze order");
						return setImmediate(seriesCb);
					})
					.catch(function (err) {
						self.scope.logger.error(err.stack);
						return setImmediate(seriesCb, err.toString());
					});
			},
			createNewFrozeOrder: function (seriesCb) {
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
						isVoteDone: order.isVoteDone,
						isTransferred: order.isTransferred
					})
					.then(function () {
						self.scope.logger.info("Successfully inserted new row in stake_orders table");
						//resolve(order.freezedAmount);
						return setImmediate(seriesCb);
					})
					.catch(function (err) {
						self.scope.logger.error(err.stack);
						return setImmediate(seriesCb, err.toString());
					});
			}
		}, function (err) {
			if (err) {
				self.scope.logger.warn(err);
				return setImmediate(cb, err);
			}
			return setImmediate(cb, null);
		});

	} else {
		return setImmediate(cb, null);
	}

};

// Export
module.exports = SendFreezeOrder

/*************************************** END OF FILE *************************************/
