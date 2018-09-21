const { promisify } = require('util');
let crypto = require('crypto');
let constants = require('../helpers/constants.js');
let sql = require('../sql/frogings.js');
let slots = require('../helpers/slots.js');
let StakeReward = require('../logic/stakeReward.js');
let request = require('request');
let async = require('async');
let Promise = require('bluebird');
let reward_sql = require('../sql/referal_sql');
let env = process.env;
let cache = require('../modules/cache');
let transactionTypes = require('../helpers/transactionTypes.js');
let Reward = require('../helpers/rewards');
let ed = require('../helpers/ed');


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
	trs.stakedAmount = data.freezedAmount;
	trs.trsName = 'STAKE';
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
					FrozeAmount:trs.stakedAmount
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
 * Distributing the Staking Reward to their sponsors.
 * Award being sent on level basis.
 * Disable refer option when main account balance becomes zero.
 * @param {address} - Address which get the staking reward.
 * @param {reward_amount} - Reward amount received.
 * @param {cb} - callback function.
 * @author - Satish Joshi
 */

Frozen.prototype.sendStakingReward = function (address, reward_amount, cb) {

	let sponsor_address = address;
	let chainReward = {};
	let i = 0;
	let reward, sender_balance;

	self.scope.db.query(reward_sql.referLevelChain, {
		address: sponsor_address
	}).then(function (user) {

		if (user.length != 0 && user[0].level != null) {

			let chain_length = user[0].level.length;

			async.eachSeries(user[0].level, function (sponsorId, callback) {

				chainReward[sponsorId] = (((Reward.level[i]) * reward_amount) / 100);

				let hash = Buffer.from(JSON.parse(self.scope.config.users[6].keys));
				let keypair = self.scope.ed.makeKeypair(hash);
				let publicKey = keypair.publicKey.toString('hex');
				self.scope.balancesSequence.add(function (reward_cb) {
					modules.accounts.getAccount({
						publicKey: publicKey
					}, function (err, account) {
						if (err) {
							return setImmediate(cb, err);
						}
						let transaction;
						let secondKeypair = null;
						account.publicKey = publicKey;

						try {
							transaction = self.scope.logic.transaction.create({
								type: transactionTypes.REFER,
								amount: chainReward[sponsorId],
								sender: account,
								recipientId: sponsorId,
								keypair: keypair,
								secondKeypair: secondKeypair,
								trsName: "CHAINREF",
								rewardPercentage: "level"+(i+1)+"&"+Reward.level[i]
							});
						} catch (e) {
							return setImmediate(cb, e.toString());
						}
						modules.transactions.receiveTransactions([transaction], true, reward_cb);
						i++;
					});
				}, function (err, transaction) {
					if (err) {
						let subString = err.toString().indexOf('balance:');
						if (subString != -1) {
							sender_balance = parseFloat(err.split('balance:')[1]);
							if (!sender_balance) {
								cache.prototype.setJsonForKey("referStatus", false);
								self.scope.logger.info("Staking Reward Info : " + err);
								return setImmediate(cb, null);
							}
							if (i == chain_length && reward != true) {
								self.scope.logger.info("Staking Reward Info : " + err);
							}
						} else {
							return callback(err);
						}
					} else {
						reward = true;
						(async function () {
							await self.scope.db.none(reward_sql.updateRewardTypeTransaction, {
								trsId: transaction[0].id,
								sponsorAddress: sponsor_address,
								introducer_address: sponsorId,
								reward: chainReward[sponsorId],
								level: "Level " + (i),
								transaction_type: "CHAINREF",
								time: slots.getTime()
							}).then(function () {

							}).catch(function (err) {
								return setImmediate(cb, err);
							});
						}());
					}
					callback();
				});

			}, function (err) {
				if (err) {
					return setImmediate(cb, err);
				}
				return setImmediate(cb, null);
			});

		} else {
			self.scope.logger.info("Staking Reward Info : Referral chain is empty");
			return setImmediate(cb, null);
		}
	}).catch(function (err) {
		return setImmediate(cb, err);
	});
}



/**
 * @desc checkFrozeOrders
 * @private
 * @implements {Frozen#getfrozeOrders}
 * @implements {Frozen#checkAndUpdateMilestone}
 * @implements {Frozen#deductFrozeAmountandSendReward}
 * @implements {Frozen#disableFrozeOrders}
 * @return {Promise} {Resolve|Reject}
 */
Frozen.prototype.checkFrozeOrders = async function (sender) {
  const getAccountAsync = promisify(modules.accounts.getAccount);

  const getFrozeOrders = async (senderId) => {
    try {
      const freezeOrders = await self.scope.db.query(sql.getActiveFrozeOrders, { senderId, currentTime: slots.getTime() });
      if (freezeOrders.length > 0) {
        self.scope.logger.info("Successfully get :" + freezeOrders.length + ", number of froze order");
      }
      return freezeOrders;
    } catch(err) {
      self.scope.logger.error(err);
      throw err;
    }
  };

  const updateOrderAndSendReward = async (order) => {
    if (order.voteCount % 4 !== 3) {
      return null;
    }
    const secret = 'hen worry two thank unfair salmon smile oven gospel grab latin reason';
    const keypair = ed.makeKeypair(crypto.createHash('sha256').update(secret, 'utf8').digest());
    const publicKey = keypair.publicKey.toString('hex');
    const blockHeight = modules.blocks.lastBlock.get().height;
    const stakeReward = __private.stakeReward.calcReward(blockHeight);
    console.log(publicKey);

    const account = await getAccountAsync({ publicKey });

    const secondKeypair = null;
    account.publicKey = publicKey;

    return self.scope.logic.transaction.create({
      type: transactionTypes.REWARD,
      amount: parseInt(order.freezedAmount * stakeReward / 100),
      sender: account,
      recipientId: order.senderId,
      keypair: keypair,
      secondKeypair: secondKeypair,
      rewardPercentage: blockHeight+'&'+stakeReward
    });
  };

  const deductFrozeAmountandSendReward = (orders) =>
    Promise.all(orders.map(order => updateOrderAndSendReward(order)));

  const deductFrozeAmount = (orders) =>
    Promise.all(orders.map(order => self.scope.db.none(sql.deductFrozeAmount, {
      FrozeAmount: order.freezedAmount,
      senderId: sender.address
    })));

  const VOTE_COUNT_LIMIT = 27;

  const disableFrozeOrder = async (freezeOrders) => {
    const unstakeOrders = [];
    let ordersIds = '';

    freezeOrders.map((order) => {
      if (order.voteCount >= VOTE_COUNT_LIMIT) {
        unstakeOrders.push(order);
        ordersIds += !ordersIds ? order.stakeId : ',' + order.stakeId
      }
    });

    await self.scope.db.none(sql.unstackOrders, {
      stakeIds: ordersIds,
      currentTime: slots.getTime(),
      totalMilestone: constants.froze.endTime / constants.froze.milestone
    });
    self.scope.logger.info("Successfully unstack orders.");

    return unstakeOrders;
  };

  const freezeOrders = await getFrozeOrders(sender.address);
  const transactionsReward = await deductFrozeAmountandSendReward(freezeOrders);
  const unstakeOrders = await disableFrozeOrder(freezeOrders);
  await deductFrozeAmount(unstakeOrders);

  return transactionsReward.filter(t => !!t);
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
					freezedAmount: userData.freezedAmount,
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
