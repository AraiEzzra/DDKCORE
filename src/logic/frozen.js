const constants = require('../helpers/constants.js');
const sql = require('../sql/frogings.js');
const slots = require('../helpers/slots.js');
const StakeReward = require('./stakeReward.js');
const Promise = require('bluebird');
const rewardSql = require('../sql/referal_sql');
const accountSql = require('../sql/accounts');
const cache = require('../modules/cache');
const transactionTypes = require('../helpers/transactionTypes.js');
const { LENGTH, writeUInt64LE } = require('../helpers/buffer.js');
const utils = require('../utils');

const __private = {};
__private.types = {};
let modules;
let self;

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
        logger,
        db,
        logic: {
            transaction
        },
        network,
        config,
        balancesSequence,
        ed
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

    trs.recipientId = null;
    trs.asset.stakeOrder = {
        stakedAmount: data.freezedAmount,
        nextVoteMilestone: trs.timestamp,
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
    }
    const stakeOrder = {
        id: raw.so_id,
        status: raw.so_status,
        startTime: raw.so_startTime,
        insertTime: raw.so_startTime,
        senderId: raw.so_senderId,
        recipientId: raw.so_recipientId,
        stakedAmount: Number(raw.so_freezedAmount),
        nextVoteMilestone: Number(raw.so_nextVoteMilestone)
    };

    return { stakeOrder, airdropReward: raw.so_airdropReward || {} };
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

Frozen.prototype.calcUndoUnconfirmed = async (trs, sender) => {
    return sender;
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
Frozen.prototype.undo = async (trs) => {
    await Promise.all([
        self.scope.db.none(sql.removeOrderByTrsId, { transactionId: trs.id }),
        self.undoAirdropReward(trs)
    ]);
    utils.deleteDocument({
        index: 'stake_orders',
        type: 'stake_orders',
        id: trs.id
    });
};

Frozen.prototype.apply = async (trs) => {
    await self.scope.db.none(sql.updateFrozeAmount, {
        reward: trs.stakedAmount,
        senderId: trs.senderId
    });
    await self.sendAirdropReward(trs);
};

/**
 * @desc get bytes
 * @private
 * @implements
* @return {Buffer}
 */
Frozen.prototype.getBytes = function (trs) {
    let offset = 0;
    const buff = Buffer.alloc(
        LENGTH.INT64 +  // asset.stakeOrder.stakedAmount
        LENGTH.UINT32 + // asset.stakeOrder.nextVoteMilestone
        LENGTH.UINT32 + // asset.stakeOrders.startTime
        LENGTH.BYTE +   // asset.airdropReward.withAirdropReward
        LENGTH.INT64    // asset.airdropReward.totalReward
    );

    offset = writeUInt64LE(buff, trs.asset.stakeOrder.stakedAmount || 0, offset);

    if (trs.height <= constants.MASTER_NODE_MIGRATED_BLOCK) {
        buff.writeInt32LE(trs.asset.stakeOrder.nextVoteMilestone, offset);
    }

    offset += LENGTH.UINT32;

    buff.writeInt32LE(trs.asset.stakeOrder.startTime, offset);
    offset += LENGTH.UINT32;

    buff.writeInt8(trs.asset.airdropReward.withAirdropReward ? 1 : 0, offset);
    offset += LENGTH.BYTE;
    writeUInt64LE(buff, trs.asset.airdropReward.totalReward || 0, offset);

    // airdropReward.sponsors up to 1 sponsors
    const sponsorsBuffer = Buffer.alloc(LENGTH.INT64 + LENGTH.INT64);

    offset = 0;
    if (trs.asset.airdropReward.sponsors && Object.keys(trs.asset.airdropReward.sponsors).length > 0) {
        const address = Object.keys(trs.asset.airdropReward.sponsors)[0];
        offset = writeUInt64LE(sponsorsBuffer, parseInt(address.slice(3), 10), offset);
        writeUInt64LE(sponsorsBuffer, trs.asset.airdropReward.sponsors[address] || 0, offset);
    }

    return Buffer.concat([buff, sponsorsBuffer]);
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

Frozen.prototype.verifyFields = function (trs, sender, cb) {
    const stakedAmount = trs.stakedAmount / 100000000;

    if (stakedAmount < 1) {
        if (constants.STAKE_VALIDATE.AMOUNT_ENABLED) {
            return setImmediate(cb, 'Invalid stake amount');
        }
        self.scope.logger.error(`VALIDATE IS DISABLED. Error: trs.id ${trs.id} Invalid stake amount`);
    }

    if ((stakedAmount % 1) !== 0) {
        if (constants.STAKE_VALIDATE.AMOUNT_ENABLED) {
            return setImmediate(cb, 'Invalid stake amount: Decimal value');
        }
        self.scope.logger.error(`VALIDATE IS DISABLED. Error: trs.id ${trs.id} Invalid stake amount: Decimal value`);
    }

    self.verifyAirdrop(trs)
        .then(() => setImmediate(cb))
        .catch((err) => {
            if (constants.STAKE_VALIDATE.AIRDROP_ENABLED) {
                return setImmediate(cb, err);
            }
            self.scope.logger.error(`VALIDATE IS DISABLED. Error: trs.id ${trs.id}, ${err}`);
            return setImmediate(cb);
        });
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
    return self.verifyFields(trs, sender, cb);
};

Frozen.prototype.newVerify = async (trs) => {
    const stakedAmount = trs.stakedAmount / 100000000;

    if (stakedAmount < 1) {
        throw new Error('Invalid stake amount');
    }

    if ((stakedAmount % 1) !== 0) {
        throw new Error('Invalid stake amount: Decimal value');
    }
    try {
        await self.verifyAirdrop(trs);
    } catch (e) {
        throw e;
    }
};

Frozen.prototype.newVerifyUnconfirmed = async (trs, sender) => {
    if (Number(trs.stakedAmount) + Number(sender.u_totalFrozeAmount) > Number(sender.u_balance)) {
        throw new Error('Verify failed: Insufficient unconfirmed balance for stake');
    }

    if ((parseInt(sender.u_balance, 10) - parseInt(sender.u_totalFrozeAmount, 10)) < (trs.stakedAmount + trs.fee)) {
        throw new Error('Insufficient unconfirmed balance');
    }
};

Frozen.prototype.verifyAirdrop = async (trs) => {
    const airdropReward = await self.getAirdropReward(
        trs.senderId,
        trs.type === transactionTypes.STAKE ? trs.stakedAmount : trs.asset.reward,
        trs.type
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
 * Calculates fee for stake transaction
 * @private
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
        accounts, rounds, blocks, transactions
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
    if (!transactionAirdropReward.withAirdropReward || transactionAirdropReward.totalReward === 0) {
        return true;
    }

    let i = 0;

    for (const sponsorId in transactionAirdropReward.sponsors) {
        const rewardAmount = transactionAirdropReward.sponsors[sponsorId];

        if (rewardAmount === 0) {
            return true;
        }

        await self.scope.db.task(async () => {
            const iterator = i;
            await self.scope.db.none(rewardSql.updateAccountBalance, {
                address: sponsorId, reward: rewardAmount
            });

            await self.scope.db.none(rewardSql.updateAccountBalance, {
                address: constants.airdrop.account, reward: -rewardAmount
            });

            await self.scope.db.none(rewardSql.updateRewardTypeTransaction, {
                trsId: trs.id,
                sponsorAddress: trs.senderId,
                introducer_address: sponsorId,
                reward: rewardAmount,
                level: `Level ${iterator}`,
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

    for (const sponsorId in transactionAirdropReward.sponsors) {
        const rewardAmount = transactionAirdropReward.sponsors[sponsorId];
        await self.scope.db.task(async () => {
            await self.scope.db.none(rewardSql.updateAccountBalance, {
                address: sponsorId, reward: -rewardAmount
            });

            await self.scope.db.none(rewardSql.updateAccountBalance, {
                address: constants.airdrop.account, reward: rewardAmount
            });
        });
    }

    await self.scope.db.none(rewardSql.deleteRewardTypeTransaction, {
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

    const availableAirdropBalance = await self.scope.db.oneOrNone(accountSql.getCurrentUnmined, {
        address: constants.airdrop.account
    });

    self.scope.logger.info(`availableAirdropBalance: ${availableAirdropBalance.balance / 100000000}`);

    const user = await self.scope.db.oneOrNone(rewardSql.referLevelChain, {
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
        const reward = transactionType === transactionTypes.STAKE ?
            Math.ceil((amount * constants.airdrop.stakeRewardPercent) / 100) :
            Math.ceil(((constants.airdrop.referralPercentPerLevel[i]) * amount) / 100);
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
        return { reward, unstake: unstakeAmount };
    }
    const freezeOrders = await self.scope.db.query(sql.getActiveFrozeOrders, {
        senderId, currentTime: slots.getTime()
    });
    await Promise.all(freezeOrders.map(async (order) => {
        if (order.voteCount > 0 && (parseInt(order.voteCount, 10) + 1) % constants.froze.rewardVoteCount === 0) {
            const blockHeight = modules.blocks.lastBlock.get().height;
            const stakeRewardPercent = __private.stakeReward.calcReward(blockHeight);
            reward += (parseInt(order.freezedAmount, 10) * stakeRewardPercent) / 100;
        }
    }));
    const readyToUnstakeOrders = freezeOrders.filter(
        o => (parseInt(o.voteCount, 10) + 1) === constants.froze.unstakeVoteCount
    );
    await Promise.all(readyToUnstakeOrders.map((order) => {
        unstakeAmount -= parseInt(order.freezedAmount, 10);
    }));
    return { reward, unstake: unstakeAmount };
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
Frozen.prototype.applyFrozeOrdersRewardAndUnstake = async function (voteTransaction, activeOrders) {
    activeOrders.forEach((order) => {
        order.freezedAmount = parseInt(order.freezedAmount, 10);
        order.voteCount = parseInt(order.voteCount, 10);
        order.status = parseInt(order.status, 10);
    });
    await Promise.all([
        await self.sendRewards(activeOrders),
        await self.sendAirdropReward(voteTransaction)
    ]);
    await self.unstakeOrders(activeOrders);
    return true;
};

Frozen.prototype.sendRewards = async (orders) => {
    const readyToRewardOrders = orders.filter((order) => {
        if (order.voteCount <= 0) {
            return false;
        }
        return order.voteCount % constants.froze.rewardVoteCount === 0;
    });
    await Promise.all(readyToRewardOrders.map(async (order) => {
        await self.sendOrderReward(order);
    }));
};

Frozen.prototype.sendOrderReward = async (order) => {
    const reward = self.getStakeReward(order);
    await self.scope.db.none(sql.updateAccountBalance, {
        reward, senderId: order.senderId
    });
    await self.scope.db.none(sql.updateTotalSupply, {
        reward: -reward, totalSupplyAccount: self.scope.config.forging.totalSupplyAccount
    });
};

Frozen.prototype.unstakeOrders = async (orders) => {
    const readyToUnstakeOrders = orders.filter(o => o.voteCount === constants.froze.unstakeVoteCount);
    await Promise.all(readyToUnstakeOrders.map(async (order) => {
        await self.scope.db.none(sql.deductFrozeAmount, {
            orderFreezedAmount: order.freezedAmount, senderId: order.senderId
        });
        await self.scope.db.none(sql.disableFrozeOrders, {
            stakeId: order.stakeId
        });
        order.status = 0;
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
    const readyToDeductRewardOrders = orders.filter((order) => {
        if (order.voteCount <= 0) {
            return false;
        }
        return order.voteCount % constants.froze.rewardVoteCount === 0;
    });
    await Promise.all(readyToDeductRewardOrders.map(async (order) => {
        await self.deductOrderReward(order);
    }));
};

Frozen.prototype.deductOrderReward = async (order) => {
    const reward = self.getStakeReward(order);
    await self.scope.db.none(sql.updateAccountBalance, {
        reward: -reward, senderId: order.senderId
    });
    await self.scope.db.none(sql.updateTotalSupply, {
        reward, totalSupplyAccount: self.scope.config.forging.totalSupplyAccount
    });
};

Frozen.prototype.recoverUnstakedOrders = async (orders) => {
    const needRecoverStakeOrders = orders.filter(o => o.status === 0);
    await Promise.all(needRecoverStakeOrders.map(async (order) => {
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
    const stakeRewardPercent = __private.stakeReward.calcReward(blockHeight);
    return parseInt(order.freezedAmount, 10) * stakeRewardPercent / 100;
};

// Export
module.exports = Frozen;

/** ************************************* END OF FILE ************************************ */
