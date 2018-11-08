let constants = require('../helpers/constants.js');
let sql = require('../sql/frogings.js');
let async = require('async');
const promise = require('bluebird');

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
					orderFreezedAmount: -trs.amount
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
					orderFreezedAmount: trs.amount
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

SendFreezeOrder.prototype.apply = async function (trs, block, sender, cb) {
	try {
        const setAccountAndGet = promise.promisify(modules.accounts.setAccountAndGet);
		const mergeAccountAndGet = promise.promisify(modules.accounts.mergeAccountAndGet);
        const getActiveFrozeOrder = promise.promisify(self.getActiveFrozeOrder);
		const sendFreezedOrder = promise.promisify(self.sendFreezedOrder);

		await setAccountAndGet({ address: trs.recipientId });

		await mergeAccountAndGet({
			address: trs.recipientId,
			balance: trs.amount,
			u_balance: trs.amount,
			blockId: block.id,
			round: modules.rounds.calc(block.height)
		});

		const order = await getActiveFrozeOrder({
			address: trs.senderId,
			stakeId: trs.stakeId
		});

		await sendFreezedOrder({
			senderId: trs.senderID,
			recipientId: trs.recipientId,
			stakeId: trs.stakeId,
			stakeOrder: order
		});

        return setImmediate(cb, null);

	} catch (err) {
        return setImmediate(cb, err);
	}

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

SendFreezeOrder.prototype.sendFreezedOrder = async function (userAndOrderData, cb) {

    //This function take active froze order from table and deduct froze amount and update froze 
	//amount in mem_account table & update old order and create new order in stake table
	try {
        let order = userAndOrderData.stakeOrder;

        if (!order) {
        	throw new Error("sendFreezedOrder: Order is empty");
		}

        self.scope.network.io.sockets.emit('stake/change', null);

        //deduct froze Amount from totalFrozeAmount in mem_accounts table
        await self.scope.db.none(sql.deductFrozeAmount,
			{
				senderId: userAndOrderData.senderId,
				orderFreezedAmount: order.freezedAmount
			});

        //update total Froze amount for recipient of froze order during sending order
        await self.scope.db.none(sql.updateFrozeAmount,
			{
				senderId: userAndOrderData.recipientId,
				reward: order.freezedAmount
			});

        //Update old freeze order
        await self.scope.db.none(sql.updateFrozeOrder,
			{
				recipientId: userAndOrderData.recipientId,
				senderId: order.senderId,
				stakeId: userAndOrderData.stakeId
			});

		//create new froze order according to send order
        await self.scope.db.none(sql.createNewFrozeOrder,
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
				transferCount: order.transferCount
			});

	} catch (err) {
        console.log("\n \n ERROR SendFreezeOrder", err);
        return setImmediate(cb, err);
	}

};

// Export
module.exports = SendFreezeOrder

/*************************************** END OF FILE *************************************/
