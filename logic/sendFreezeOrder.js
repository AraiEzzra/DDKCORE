let constants = require('../helpers/constants.js');
let sql = require('../sql/frogings.js');
let async = require('async');
let utils = require('../utils');
const promise = require('bluebird');

const SENDSTAKE_VERIFICATION = constants.SENDSTAKE_VERIFICATION;

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

async function rollbackOrders(trs, cb) {

	try {

        const {id, nextVoteMilestone} = await self.scope.db.one(sql.getOrderForUndo,
            {
                stakeId: trs.stakeId,
                senderId: trs.recipientId
            });

        await self.scope.db.one(sql.updateOldOrder,
            {
                stakeId: trs.stakeId,
                nextVoteMilestone: nextVoteMilestone
            });

        await self.scope.db.one(sql.removeOrderByTrsIdAndSenderId,
            {
                id: id,
                senderId: trs.recipientId
            });

        return Promise.resolve();

	} catch (err) {
        self.scope.logger.error(err.stack);
		return setImmediate(cb, err.toString());
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

SendFreezeOrder.prototype.undo = async function (trs, block, sender, cb) {
	try {

        //Add frozeAmount to mem_account to sender address
        await self.scope.db.none(sql.deductFrozeAmount,
            {
                senderId: sender.address,
                orderFreezedAmount: -trs.amount
            });

        //remove frozeAmount to mem_account to recipient address
        await self.scope.db.none(sql.deductFrozeAmount,
            {
                senderId: trs.recipientId,
                orderFreezedAmount: trs.amount
            });

        await rollbackOrders(trs, cb);

        const setAccountAndGet = promise.promisify(modules.accounts.setAccountAndGet);
        const mergeAccountAndGet = promise.promisify(modules.accounts.mergeAccountAndGet);

        await setAccountAndGet({ address: trs.recipientId });

        await mergeAccountAndGet({
            address: trs.recipientId,
            balance: -trs.amount,
            u_balance: -trs.amount,
            blockId: block.id,
            round: modules.rounds.calc(block.height)
        });

        return setImmediate(cb, err);

    } catch (err) {
        self.scope.logger.error(err.stack);
        return setImmediate(cb, err.toString());
	}
};

SendFreezeOrder.prototype.apply = async function (trs, block, sender, cb) {
	try {

        const setAccountAndGet = promise.promisify(modules.accounts.setAccountAndGet);
		const mergeAccountAndGet = promise.promisify(modules.accounts.mergeAccountAndGet);
        const getActiveFrozeOrder = promise.promisify(self.getActiveFrozeOrder);

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

		const stakeOrders = await self.sendFreezedOrder({
			trsId: trs.id,
			senderId: trs.senderId,
			recipientId: trs.recipientId,
			stakeId: trs.stakeId,
			stakeOrder: order
		});
		const bulkStakeOrders = utils.makeBulk([stakeOrders.new],'stake_orders');
		await utils.indexall(bulkStakeOrders, 'stake_orders');
		await utils.updateDocument({
            index: 'stake_orders',
            type: 'stake_orders',
            body: stakeOrders.prev,
			id: stakeOrders.prev.id
        });

		self.scope.network.io.sockets.emit('stake/change', null);

        return setImmediate(cb, null);

	} catch (err) {
        return setImmediate(cb, err);
	}
};

SendFreezeOrder.prototype.getBytes = function (trs) {
	return Buffer.from([]);
};

SendFreezeOrder.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

SendFreezeOrder.prototype.verifyFields = function (trs, sender, cb) {
	if (!trs.recipientId) {
		if (SENDSTAKE_VERIFICATION.VERIFY_RECIPIENT_ID_ENABLED) {
            return setImmediate(cb, 'Missing recipient');
        } else {
			self.scope.logger.error('Missing recipient in transaction with id: ', trs.id);
		}
	}

	if (parseInt(trs.fee) > (parseInt(sender.balance) - parseInt(sender.totalFrozeAmount))) {
		if (SENDSTAKE_VERIFICATION.VERIFY_BALANCE_ENABLED) {
			return setImmediate(cb, 'Insufficient balance');
		} else {
			self.scope.logger.error('Insufficient balance in transaction with id: ', trs.id);
		}
	}

	self.getActiveFrozeOrder({
		address: trs.senderId,
		stakeId: trs.stakeId,
	}, function (err, order) {

		if (order === null) {
			if (SENDSTAKE_VERIFICATION.VERIFY_ACTIVE_FROZE_ORDER_EXIST_ENABLED) {
				return setImmediate(cb, `Orders not found`);
			} else {
				self.scope.logger.error(`Orders not found in transaction with id:`, trs.id)
			}
		}

		if (order.transferCount >= constants.maxTransferCount) {
			if (SENDSTAKE_VERIFICATION.VERIFY_ACTIVE_FROZE_ORDER_TRANSFERCOUNT_ENABLED) {
				return setImmediate(cb, `Order can be send only ${constants.maxTransferCount} times`);
			} else {
				self.scope.logger.error(`Order can be send only ${constants.maxTransferCount} times`)
			}
		} else {
			return setImmediate(cb, null, trs);
		}
	});
};

SendFreezeOrder.prototype.verify = function (trs, sender, cb) {
	return self.verifyFields(trs, sender, cb);
};

SendFreezeOrder.prototype.verifyUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
}

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
        const prevOrder = await self.scope.db.one(sql.updateFrozeOrder,
			{
				recipientId: userAndOrderData.recipientId,
				senderId: order.senderId,
				stakeId: userAndOrderData.stakeId
			});

		//create new froze order according to send order
        const newOrder = await self.scope.db.one(sql.createNewFrozeOrder,
			{
				id: userAndOrderData.trsId,
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
		return {
			new: newOrder,
			prev: prevOrder
		}
	} catch (err) {
		return setImmediate(cb, err);
	}

};

// Export
module.exports = SendFreezeOrder

/*************************************** END OF FILE *************************************/
