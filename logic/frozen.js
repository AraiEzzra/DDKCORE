const constants = require('../helpers/constants.js');
const sql = require('../sql/frogings.js');
const slots = require('../helpers/slots.js');
const StakeReward = require('../logic/stakeReward.js');
const async = require('async');
const Promise = require('bluebird');
const reward_sql = require('../sql/referal_sql');
const account_sql = require('../sql/accounts');
const cache = require('../modules/cache');
const transactionTypes = require('../helpers/transactionTypes.js');
let utils = require('../utils');

const __private = {};
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
Frozen.prototype.create = async function (data, trs) {

    const senderId = data.sender.address;
    const airdropReward = await self.getAirdropReward(senderId, data.freezedAmount, data.type);

    const date = new Date(trs.timestamp * 1000);
    trs.recipientId = null;
    trs.asset.stakeOrder = {
        stakedAmount: data.freezedAmount,
        nextVoteMilestone: (date.setMinutes(date.getMinutes())) / 1000,
        startTime: trs.timestamp
    };
    trs.asset.airdropReward = {
        withAirdropReward: airdropReward.allowed,
        sponsors: airdropReward.sponsors,
        totalReward: airdropReward.total
    };

    if (data.stakeId) {
        trs.stakeId = data.stakeId;
    }
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
    'nextVoteMilestone',
    'airdropReward'
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

    // FIXME delete bad transaction migration
    if (!trs.asset || trs.stakedAmount <= 0) {
      return null;
    }
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
            nextVoteMilestone: trs.asset.stakeOrder.nextVoteMilestone,
            airdropReward: trs.asset.airdropReward || {}
        }
    };
};

/**
 * Creates froze object based on raw data.
 * @param {Object} raw
 * @return {null|froze} block object
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
            stakedAmount: Number(raw.so_freezedAmount),
            nextVoteMilestone: Number(raw.so_nextVoteMilestone)
        };

        return { stakeOrder: stakeOrder, airdropReward: raw.so_airdropReward || {} };
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
    (async () => {
        await Promise.all([
            self.scope.db.none(sql.removeOrderByTrsId, { transactionId: trs.id }),
            self.scope.db.none(sql.deductFrozeAmount, {
                senderId: trs.senderId,
                orderFreezedAmount: trs.stakedAmount
            }),
            self.undoAirdropReward(trs)
        ]);
    })()
    .then(function () {
        utils.deleteDocument({
            index: 'stake_orders',
            type: 'stake_orders',
            id: trs.id
        }, function (err) {
            if (err) {
                self.scope.logger.error('Elasticsearch: document deletion error : ' + err);
            } else {
                self.scope.logger.info('Elasticsearch: document deleted successfullly');
            }
        });
        
        return setImmediate(cb);
    })
    .catch(function (err) {
        return setImmediate(cb, `Undo stake error: ${err}`);
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
    async.series([
        function (seriesCb) {
            self.updateFrozeAmount({ account: sender, freezedAmount: trs.stakedAmount },
            function (err) {
                if (err) {
                    return setImmediate(seriesCb, err);
                }

                return setImmediate(seriesCb, null, trs);
            });
        },
        function (seriesCb) {
            self.sendAirdropReward(trs)
            .then(
                () => {
                    setImmediate(seriesCb, null, trs);
                },
                err => setImmediate(seriesCb, err)
            );
        }
    ], cb);
};

/**
 * @desc get bytes
 * @private
 * @implements
 * @return {null}
 * FIXME add bytes to stake https://trello.com/c/lpgvxc2x/129-add-bytes-to-stake
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
    const stakedAmount = trs.stakedAmount / 100000000;

    if (stakedAmount < 1) {
        return setImmediate(cb, 'Invalid stake amount');
    }

    if ((stakedAmount % 1) !== 0) {
        return setImmediate(cb, 'Invalid stake amount: Decimal value');
    }

	if (Number(trs.stakedAmount) + Number(sender.totalFrozeAmount) > Number(sender.u_balance)) {
		return setImmediate(cb, 'Verify failed: Insufficient balance for stake');
	}

	self.verifyAirdrop(trs)
	.then(() => {
		return setImmediate(cb, null);
	})
	.catch((err) => {
        return setImmediate(cb, err);
    });
};


Frozen.prototype.verifyAirdrop = async (trs) => {
    const airdropReward = await self.getAirdropReward(
        trs.senderId,
        trs.type === transactionTypes.STAKE ? trs.stakedAmount : trs.asset.reward, trs.type
    );

    if (
        airdropReward.allowed !== trs.asset.airdropReward.withAirdropReward ||
        JSON.stringify(airdropReward.sponsors) !== JSON.stringify(trs.asset.airdropReward.sponsors) ||
        airdropReward.total !== trs.asset.airdropReward.totalReward
    ) {
        throw `Verify failed: ${trs.type === transactionTypes.STAKE ? 'stake' : 'vote'} airdrop reward is corrupted`;
    }
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
        accounts: accounts, rounds: rounds, blocks: blocks, transactions: transactions
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
    if (!transactionAirdropReward.withAirdropReward) {
        return true;
    }

    let i = 0;

    for (let sponsorId in transactionAirdropReward.sponsors) {
        const rewardAmount = transactionAirdropReward.sponsors[sponsorId];
        await self.scope.db.task(async () => {

            const iterator = i;
            await self.scope.db.none(reward_sql.updateAccountBalance, {
                address: sponsorId, reward: rewardAmount
            });

            await self.scope.db.none(reward_sql.updateAccountBalance, {
                address: constants.airdrop.account, reward: -rewardAmount
            });

            await self.scope.db.none(reward_sql.updateRewardTypeTransaction, {
                trsId: trs.id,
                sponsorAddress: trs.senderId,
                introducer_address: sponsorId,
                reward: rewardAmount,
                level: 'Level ' + (iterator),
                transaction_type: trs.type === transactionTypes.STAKE ? 'DIRECTREF' : 'CHAINREF',
                time: slots.getTime()
            });

        });
        i++;
    }

    return true;
};

Frozen.prototype.undoAirdropReward = async function (trs) {

    const transactionAirdropReward = trs.asset.airdropReward;
    if (!transactionAirdropReward.withAirdropReward) {
        return true;
    }

    for (let sponsorId in transactionAirdropReward.sponsors) {
        const rewardAmount = transactionAirdropReward.sponsors[sponsorId];
        await self.scope.db.task(async () => {

            await self.scope.db.none(reward_sql.updateAccountBalance, {
                address: sponsorId, reward: -rewardAmount
            });

            await self.scope.db.none(reward_sql.updateAccountBalance, {
                address: constants.airdrop.account, reward: rewardAmount
            });

        });
    }

    await self.scope.db.none(reward_sql.deleteRewardTypeTransaction, {
        trsId: trs.id
    });

    return true;
};

Frozen.prototype.getAirdropReward = async function (senderAddress, amount, transactionType) {
    const result = {
        total: 0, sponsors: {}, allowed: false
    };

    try {
        if (!await cache.prototype.getJsonForKeyAsync('referStatus')) {
            return result;
        }
    } catch (err) {
        self.scope.logger.error(err);
    }

    // TODO use u_balance
    const availableAirdropBalance = await self.scope.db.oneOrNone(account_sql.getCurrentUnmined, {
        address: constants.airdrop.account
    });

    self.scope.logger.info(`availableAirdropBalance: ${availableAirdropBalance.balance / 100000000}`);

    const user = await self.scope.db.oneOrNone(reward_sql.referLevelChain, {
        address: senderAddress
    });

    if (!user || !user.level || (user.level.length === 0)) {
        return result;
    }

    if (transactionType === transactionTypes.STAKE) {
        user.level = [user.level[0]];
    }

    let airdropRewardAmount = 0;
    const sponsors = {};

    user.level.forEach((sponsorAddress, i) => {
        const reward = transactionType === transactionTypes.STAKE ? ((amount * constants.airdrop.stakeRewardPercent) / 100) : (((constants.airdrop.referralPercentPerLevel[i]) * amount) / 100);
        sponsors[sponsorAddress] = reward;
        airdropRewardAmount += reward;
    });

    if (availableAirdropBalance.balance < airdropRewardAmount) {
        try {
            await cache.prototype.setJsonForKeyAsync('referStatus', false);
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


Frozen.prototype.calculateTotalRewardAndUnstake = async function (senderId, isDownVote) {
    let reward = 0;
    let unstakeAmount = 0;
    if (isDownVote) {
        return { reward: reward, unstake: unstakeAmount };
    }
    const freezeOrders = await self.scope.db.query(sql.getActiveFrozeOrders, {
        senderId, currentTime: slots.getTime()
    });
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
    return { reward: reward, unstake: unstakeAmount };
};

/**
 * @desc applyFrozeOrdersRewardAndUnstake
 * @private
 * @implements {Frozen#getfrozeOrders}
 * @implements {Frozen#checkAndUpdateMilestone}
 * @implements {Frozen#deductFrozeAmountandSendReward}
 * @implements {Frozen#disableFrozeOrders}
 * @return {Promise} {Resolve|Reject}
 */
Frozen.prototype.applyFrozeOrdersRewardAndUnstake = async function (voteTransaction) {
    const senderId = voteTransaction.senderId;
    const freezeOrders = await self.scope.db.query(sql.getActiveFrozeOrders, {
        senderId, currentTime: slots.getTime()
    });
    freezeOrders.forEach((order) => {
        order.freezedAmount = parseInt(order.freezedAmount, 10);
        order.voteCount = parseInt(order.voteCount, 10);
        order.status = parseInt(order.status, 10);
    });
    await Promise.all([
        await self.sendRewards(freezeOrders),
        await self.sendAirdropReward(voteTransaction)
    ]);
    await self.unstakeOrders(freezeOrders);
    return true;
};

Frozen.prototype.sendRewards = async (orders) => {
    const readyToRewardOrders = orders.filter(order => {
        if (order.voteCount <= 0) {
            return false;
        }
        return order.voteCount % constants.froze.rewardVoteCount === 0;
    });
    await Promise.all(readyToRewardOrders.map(async order => {
        await self.sendOrderReward(order);
    }));
};

Frozen.prototype.sendOrderReward = async (order) => {
    const reward = self.getStakeReward(order);
    await self.scope.db.none(sql.updateAccountBalance, {
        reward: reward, senderId: order.senderId
    });
    await self.scope.db.none(sql.updateTotalSupply, {
        reward: -reward, totalSupplyAccount: self.scope.config.forging.totalSupplyAccount
    });
};

Frozen.prototype.unstakeOrders = async (orders) => {
    const readyToUnstakeOrders = orders.filter(o => {
        return o.voteCount === constants.froze.unstakeVoteCount;
    });
    await Promise.all(readyToUnstakeOrders.map(async order => {
    await self.scope.db.none(sql.deductFrozeAmount, {
        orderFreezedAmount: order.freezedAmount, senderId: order.senderId
    });
    await self.scope.db.none(sql.disableFrozeOrders, {
        stakeId: order.stakeId
    });
    }));
};

Frozen.prototype.undoFrozeOrdersRewardAndUnstake = async function (voteTransaction) {
    const senderId = voteTransaction.senderId;
    const updatedOrders = await self.scope.db.query(sql.getRecentlyChangedFrozeOrders, {
        senderId, currentTime: slots.getTime()
    });
    updatedOrders.forEach((order) => {
        order.freezedAmount = parseInt(order.freezedAmount, 10);
        order.voteCount = parseInt(order.voteCount, 10);
        order.status = parseInt(order.status, 10);
    });
    await Promise.all([
        self.recoverUnstakedOrders(updatedOrders),
        self.deductRewards(updatedOrders),
        self.undoAirdropReward(voteTransaction)
    ]);
    return [];
};

Frozen.prototype.deductRewards = async (orders) => {
    const readyToDeductRewardOrders = orders.filter(order => {
        if (order.voteCount <= 0) {
            return false;
        }
        return order.voteCount % constants.froze.rewardVoteCount === 0;
    });
    await Promise.all(readyToDeductRewardOrders.map(async order => {
        await self.deductOrderReward(order);
    }));
};

Frozen.prototype.deductOrderReward = async (order) => {
    const reward = self.getStakeReward(order);
    await self.scope.db.none(sql.updateAccountBalance, {
        reward: -reward, senderId: order.senderId
    });
    await self.scope.db.none(sql.updateTotalSupply, {
        reward: reward, totalSupplyAccount: self.scope.config.forging.totalSupplyAccount
    });
};

Frozen.prototype.recoverUnstakedOrders = async (orders) => {
    const needRecoverStakeOrders = orders.filter(o => {
        return o.status === 0;
    });
    await Promise.all(needRecoverStakeOrders.map(async order => {
        await self.recoverUnstakedOrder(order);
    }));
};

Frozen.prototype.recoverUnstakedOrder = async (order) => {
    await self.scope.db.none(sql.updateFrozeAmount, {
        reward: order.freezedAmount, senderId: order.senderId
    });
    await self.scope.db.none(sql.enableFrozeOrder, {
        stakeId: order.stakeId
    });
};

Frozen.prototype.getStakeReward = (order) => {
    const blockHeight = modules.blocks.lastBlock.get().height;
    const stakeRewardPercent =  __private.stakeReward.calcReward(blockHeight);
    const reward = parseInt(order.freezedAmount, 10) * stakeRewardPercent / 100;
    return reward;
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
            const frozeAmountFromDB = totalFrozeAmount.totalFrozeAmount;
            totalFrozeAmount = parseInt(frozeAmountFromDB) + userData.freezedAmount;
            const totalFrozeAmountWithFees = totalFrozeAmount + self.calculateFee(userData.freezedAmount);
            if (totalFrozeAmountWithFees <= userData.account.balance) {
                self.scope.db.none(sql.updateFrozeAmount, {
                    reward: userData.freezedAmount, senderId: userData.account.address
                })
                .then(function () {
                    self.scope.logger.info(
                      userData.account.address, ': is update its froze amount in mem_accounts table'
                    );
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
