
let constants = require('../helpers/constants.js');
let sql = require('../sql/frogings.js');
let slots = require('../helpers/slots.js');
let StakeReward = require('../logic/stakeReward.js');
let request = require('request');
let async = require('async');
let Promise = require('bluebird');
let reward_sql = require('../sql/referal_sql');
let account_sql = require('../sql/accounts');
let cache = require('../modules/cache');
let transactionTypes = require('../helpers/transactionTypes.js');
let Reward = require('../helpers/rewards');

let __private = {};
__private.types = {};
let modules, library, self;

/**
 * Main Frozen logic.
 * @memberof module:frogings
 * @class
 * @classdesc Main Frozen logic.
 * @param {Object} logger
 * @param {Dataabase} db
 * @param {Transaction} transaction
 * @param {Network} network
 * @param {Object} config
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} With `this` as data.
 */
// Constructor
function Frozen(logger, db, transaction, network, config, balancesSequence, ed, cb) {
	self = this;
	self.scope = {
		logger: logger,
		db: db,
		logic: {
			transaction: transaction
		},
		network: network,
		config: config,
		balancesSequence: balancesSequence,
		ed: ed
	};

	if (cb) {
		return setImmediate(cb, null, this);
	}
}

// Private methods
/**
 * Creates a stakeReward instance.
 * @private
 */
__private.stakeReward = new StakeReward();

/**
 * create stake_orders table records
 * @param {Object} data - stake order data
 * @param {Object} trs - transaction data
 * @returns {trs} trs
 */
Frozen.prototype.create = function (data, trs) {
	
	let date = new Date(trs.timestamp * 1000);
	trs.recipientId = null;
	trs.asset.stakeOrder = {
		stakedAmount: data.freezedAmount,
		nextVoteMilestone: (date.setMinutes(date.getMinutes())) / 1000,
		startTime: trs.timestamp
	};
	if (data.stakeId) {
		trs.stakeId = data.stakeId;
	}
	trs.stakedAmount = data.freezedAmount;
	trs.trsName = 'STAKE';
	self.scope.logger.info('STAKE CREATE');
	return trs;
};

/**
 * @desc on modules ready
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} frz - stake order data
 * @param {function} cb - Callback function.
 * @return {bool} true
 */
Frozen.prototype.ready = function (frz, sender) {
	return true;
};

/**
 * @desc stake_order table name
 */
Frozen.prototype.dbTable = 'stake_orders';

/**
 * @desc stake_order table fields
 */
Frozen.prototype.dbFields = [
	'id',
	'status',
	'startTime',
	'insertTime',
	'senderId',
	'recipientId',
	'freezedAmount',
	'nextVoteMilestone'
];

Frozen.prototype.inactive = '0';
Frozen.prototype.active = '1';

/**
 * Creates db object transaction to `stake_orders` table.
 * @param {trs} trs
 * @return {Object} created object {table, fields, values}
 * @throws {error} catch error
 */
Frozen.prototype.dbSave = function (trs) {
	return {
		table: this.dbTable,
		fields: this.dbFields,
		values: {
			id: trs.id,
			status: this.active,
			startTime: trs.asset.stakeOrder.startTime,
			insertTime: trs.asset.stakeOrder.startTime,
			senderId: trs.senderId,
			recipientId: trs.recipientId,
			freezedAmount: trs.asset.stakeOrder.stakedAmount,
			nextVoteMilestone: trs.asset.stakeOrder.nextVoteMilestone
		}
	};
};

/**
 * Creates froze object based on raw data.
 * @param {Object} raw
 * @return {null|froze} blcok object
 */
Frozen.prototype.dbRead = function (raw) {
	if (!raw.so_id) {
		return null;
	} else {
		let stakeOrder = {
			id: raw.so_id,
			status: raw.so_status,
			startTime: raw.so_startTime,
			insertTime: raw.so_startTime,
			senderId: raw.so_senderId,
			recipientId: raw.so_recipientId,
			stakedAmount: raw.so_freezedAmount,
			nextVoteMilestone: raw.so_nextVoteMilestone
		};

		return { stakeOrder: stakeOrder };
	}
};

/**
 * @param {trs} trs
 * @return {error|transaction} error string | trs normalized
 * @throws {string|error} error message | catch error
 */
Frozen.prototype.objectNormalize = function (trs) {
	delete trs.blockId;
	return trs;
};

/**
 * @desc undo unconfirmed transations
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Frozen.prototype.undoUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
};

/**
 * @desc apply unconfirmed transations
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Frozen.prototype.applyUnconfirmed = function (trs, sender, cb) {
	return setImmediate(cb);
};

/**
 * @private
 * @implements 
 * @param {Object} block - block data
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} {cb, err}
 */
Frozen.prototype.undo = function (trs, block, sender, cb) {

	self.scope.db.none(sql.RemoveOrder,
		{
			id: trs.id,
			address: trs.senderId
		})
		.then(function () {
			self.scope.db.none(sql.deductFrozeAmount,
				{
					senderId: trs.senderId,
					orderFreezedAmount: trs.stakedAmount
				})
				.then(function () {
					return setImmediate(cb);
				})
				.catch(function (err) {
					self.scope.logger.error(err.stack);
					return setImmediate(cb, 'Stake#DeductStakeAmount from mem_account error');
				});
		})
		.catch(function (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, 'Stake#deleteOrder error');
		});
};

/**
 * @desc apply
 * @private
 * @implements 
 *  @param {Object} block - block data
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Frozen.prototype.apply = function (trs, block, sender, cb) {

	self.updateFrozeAmount({
		account: sender,
		freezedAmount: trs.stakedAmount
	}, function (err) {
		if (err) {
			return setImmediate(cb, err);
		}

		return setImmediate(cb, null, trs);
	});
};

/**
 * @desc get bytes
 * @private
 * @implements 
 * @return {null}
 */
Frozen.prototype.getBytes = function (trs) {
	return null;
};

/**
 * @desc process transaction
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Frozen.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

/**
 * @desc verify
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} {cb, err, trs}
 */
Frozen.prototype.verify = function (trs, sender, cb) {
	let amount = trs.stakedAmount / 100000000;

	if (amount < 1) {
		return setImmediate(cb, 'Invalid stake amount');
	}

	if((amount%1)!= 0){
		return setImmediate(cb, 'Invalid stake amount: Decimal value');
	}

	return setImmediate(cb, null, trs);
};

/**
 * @desc calculate fee for transaction type 9
 * @private
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @return % based on amount
 */
Frozen.prototype.calculateFee = function (trs, sender) {
	return (trs.stakedAmount * constants.fees.froze) / 100;
};

/**
 * @desc on bind
 * @private
 * @implements 
 * @param {Object} accounts - modules:accounts
 */
Frozen.prototype.bind = function (accounts, rounds, blocks, transactions) {
	modules = {
		accounts: accounts,
		rounds: rounds,
		blocks: blocks,
		transactions: transactions
	};
};

/**
 * Distributing the Airdrop Reward to their sponsors.
 * Award being sent on level basis.
 * Disable refer option when main account balance becomes zero.
 * @param {trs} - Transaction.
 * @author - Satish Joshi
 */

Frozen.prototype.sendAirdropReward = async function (trs) {

    const transactionAirdropReward = trs.asset.airdropReward;
    const recipientAddress = trs.recipientId;
    let i = 0;

    for(let sponsorId in transactionAirdropReward.sponsors) {
        const rewardAmount = transactionAirdropReward.sponsors[sponsorId];
        await self.scope.db.task(async () => {

        	const iterator = i;
            await self.scope.db.none(reward_sql.updateAccountBalance, {
                address: sponsorId,
                reward: rewardAmount
            });

            await self.scope.db.none(reward_sql.updateAccountBalance, {
                address: constants.airdropAccount,
                reward: -rewardAmount
            });

            await self.scope.db.none(reward_sql.updateRewardTypeTransaction, {
                trsId: trs.id,
                sponsorAddress: recipientAddress,
                introducer_address: sponsorId,
                reward: rewardAmount,
                level: "Level " + (iterator),
                transaction_type: "CHAINREF",
                time: slots.getTime()
            });

        });
        i++;
    }

    return true;
};

Frozen.prototype.getAirdropReward = async function (recipientAddress, voteReward) {
	const result = {
        total: 0,
        sponsors: {},
        allowed: false
	};

	try {
        if (!await cache.prototype.getJsonForKeyAsync("referStatus")) {
            return result;
        }
	} catch (err){
        self.scope.logger.error(err);
	}

    // TODO use u_balance
    const availableAirdropBalance = await self.scope.db.one(account_sql.getCurrentUnmined, {
        address: constants.airdropAccount
    });

    const user = await self.scope.db.one(reward_sql.referLevelChain, {
        address: recipientAddress
    });

    if (user.length === 0 || !user.level) {
        return result;
    }

    let airdropRewardAmount = 0;
    const sponsors = {};
    user.level.map((sponsorAddress, i) => {
        const amount = (((Reward.level[i]) * voteReward) / 100);
        sponsors[sponsorAddress] = amount;
        airdropRewardAmount += amount;
	});

    if (availableAirdropBalance < airdropRewardAmount) {
        try {
            await cache.prototype.setJsonForKeyAsync("referStatus", false);
        } catch (err) {
            self.scope.logger.error(err);
        }
        return result;
    }

    result.total = airdropRewardAmount;
    result.sponsors = sponsors;
    result.allowed = true;

    return result;
};


Frozen.prototype.calculateTotalRewardAndUnstake = async function (senderId) {
    let reward = 0;
    let unstakeAmount = 0;
    const freezeOrders = await self.scope.db.query(sql.getActiveFrozeOrders, { senderId, currentTime: slots.getTime() });
    await Promise.all(freezeOrders.map(async order => {
        if (order.voteCount > 0 && (parseInt(order.voteCount, 10) + 1) % constants.froze.rewardVoteCount === 0) {
            const blockHeight = modules.blocks.lastBlock.get().height;
            const stakeRewardPercent = __private.stakeReward.calcReward(blockHeight);
            reward += parseInt(order.freezedAmount, 10) * stakeRewardPercent / 100;
        }
    }));
    const readyToUnstakeOrders = freezeOrders.filter(o => (parseInt(o.voteCount, 10) + 1) === constants.froze.unstakeVoteCount);
    await Promise.all(readyToUnstakeOrders.map(order => {
    	unstakeAmount -= parseInt(order.freezedAmount, 10);
    }));
    return {reward: reward, unstake: unstakeAmount};
};

/**
 * @desc checkFrozeOrders
 * @private
 * @implements {Frozen#getfrozeOrders}
 * @implements {Frozen#checkAndUpdateMilestone}
 * @implements {Frozen#deductFrozeAmountandSendReward}
 * @implements {Frozen#disableFrozeOrders}
 * @return {Promise} {Resolve|Reject}
 */
Frozen.prototype.checkFrozeOrders = async function (voteTransaction) {
    const senderId = voteTransaction.senderId;

    const getFrozeOrders = async (senderId) => {
        try {
            const freezeOrders = await self.scope.db.query(sql.getActiveFrozeOrders, { senderId, currentTime: slots.getTime() });
            if (freezeOrders.length > 0) {
                self.scope.logger.info("Successfully get :" + freezeOrders.length + ", number of froze order");
            }
            return freezeOrders;
        } catch (err) {
            self.scope.logger.error(err);
            throw err;
        }
    };

    const sendRewards = async (orders) => {
        const readyToRewardOrders = orders.filter(order => {
            if (order.voteCount <= 0)
            	return false;
            return order.voteCount % constants.froze.rewardVoteCount === 0;
		});

        if (readyToRewardOrders.length > 0) {
            await Promise.all(readyToRewardOrders.map(async order => {
                await sendOrderReward(order);
            }));
        }

        if (voteTransaction.asset.airdropReward.allowed)
        	await self.sendAirdropReward(voteTransaction);
    };

    const sendOrderReward = async (order) => {
        let blockHeight = modules.blocks.lastBlock.get().height;
        let stakeRewardPercent = __private.stakeReward.calcReward(blockHeight);
        const reward = parseInt(order.freezedAmount, 10) * stakeRewardPercent / 100;
        order.freezedAmount = parseInt(order.freezedAmount, 10) + reward;
        await self.scope.db.none(sql.updateOrderFrozeAmount, {
            freezedAmount: order.freezedAmount,
            stakeId: order.stakeId
        });
        await self.scope.db.none(sql.updateAccountBalanceAndFroze, {
            reward: reward,
            senderId: order.senderId
        });
        await self.scope.db.none(sql.deductTotalSupply, {
        	reward: reward,
        	totalSupplyAccount: self.scope.config.forging.totalSupplyAccount
		});
    };

    const unstakeOrder = async (order) => {
        await self.scope.db.none(sql.deductFrozeAmount, {
            orderFreezedAmount: order.freezedAmount,
            senderId: order.senderId
        });
        await self.scope.db.none(sql.disableFrozeOrders, {
			stakeId: order.stakeId
		});
    };

    const freezeOrders = await getFrozeOrders(senderId);
    await sendRewards(freezeOrders);
    const readyToUnstakeOrders = freezeOrders.filter(o => {
        return o.voteCount === constants.froze.unstakeVoteCount;
	});
    await Promise.all(readyToUnstakeOrders.map(order => unstakeOrder(order)));
    return [];
};
/**
 * @desc updateFrozeAmount
 * @private
 * @param {Object} userData - user data
 * @param {function} cb - Callback function.
 * @return {function} {cb, err}
 */
Frozen.prototype.updateFrozeAmount = function (userData, cb) {

	self.scope.db.one(sql.getFrozeAmount, {
		senderId: userData.account.address
	})
		.then(function (totalFrozeAmount) {
			if (!totalFrozeAmount) {
				return setImmediate(cb, 'No Account Exist in mem_account table for' + userData.account.address);
			}
			let frozeAmountFromDB = totalFrozeAmount.totalFrozeAmount;
			totalFrozeAmount = parseInt(frozeAmountFromDB) + userData.freezedAmount;
			let totalFrozeAmountWithFees = totalFrozeAmount + (parseFloat(constants.fees.froze) * (userData.freezedAmount)) / 100;
			if (totalFrozeAmountWithFees <= userData.account.balance) {
				self.scope.db.none(sql.updateFrozeAmount, {
					reward: userData.freezedAmount,
					senderId: userData.account.address
				})
					.then(function () {
						self.scope.logger.info(userData.account.address, ': is update its froze amount in mem_accounts table ');
						return setImmediate(cb, null);
					})
					.catch(function (err) {
						self.scope.logger.error(err.stack);
						return setImmediate(cb, err.toString());
					});
			} else {
				return setImmediate(cb, 'Not have enough balance');
			}
		})
		.catch(function (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, err.toString());
		});

};

// Export
module.exports = Frozen;

/*************************************** END OF FILE *************************************/
