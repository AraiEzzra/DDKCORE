const crypto = require('crypto');
const schema = require('../schema/frogings.js');
const sql = require('../sql/frogings.js');
const TransactionPool = require('../logic/transactionPool.js');
const transactionTypes = require('../helpers/transactionTypes.js');
const Frozen = require('../logic/frozen.js');
const constants = require('../helpers/constants.js');
const cache = require('./cache.js');
const slots = require('../helpers/slots.js');

const COUNT_ACTIVE_STAKE_HOLDERS_KEY = 'COUNT_ACTIVE_STAKE_HOLDERS';
const COUNT_ACTIVE_STAKE_HOLDERS_EXPIRE = 300; // 5 minutes
const COUNT_TOTAL_DDK_STAKED = 'COUNT_TOTAL_DDK_STAKED';
const COUNT_TOTAL_DDK_STAKED_EXPIRE = 300; // 5 minutes
const MY_STAKED_AMOUNT = 'MY_STAKED_AMOUNT';
const MY_STAKED_AMOUNT_EXPIRE = 300; // 5 minutes
const ALL_FREEZE_ORDERS = 'ALL_FREEZE_ORDERS';
const ALL_FREEZE_ORDERS_EXPIRE = 300; // 5 minutes
const ALL_ACTIVE_FREEZE_ORDERS = 'ALL_ACTIVE_FREEZE_ORDERS';
const ALL_ACTIVE_FREEZE_ORDERS_EXPIRE = 300; // 5 minutes

// Private fields
const __private = {};
let modules;
let library;
let self;

__private.assetTypes = {};

/**
 * Initializes library with scope content and generates a Transfer instance
 * and a TransactionPool instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:transactions
 * @class
 * @classdesc Main transactions methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function Frogings(cb, scope) {
    library = {
        logger: scope.logger,
        db: scope.db,
        cache: scope.cache,
        schema: scope.schema,
        ed: scope.ed,
        balancesSequence: scope.balancesSequence,
        logic: {
            transaction: scope.logic.transaction,
            frozen: scope.logic.frozen
        },
        genesisblock: scope.genesisblock,
        network: scope.network,
        config: scope.config
    };

    self = this;

    __private.transactionPool = new TransactionPool(
        scope.config.broadcasts.broadcastInterval,
        scope.config.broadcasts.releaseLimit,
        scope.config.transactions.maxTxsPerQueue,
        scope.logic.transaction,
        scope.bus,
        scope.logger
    );

    __private.assetTypes[transactionTypes.STAKE] = library.logic.transaction.attachAssetType(
        transactionTypes.STAKE, new Frozen(scope.logger, scope.db, scope.logic.transaction, scope.network, scope.config, scope.balancesSequence, scope.ed)
    );

    setImmediate(cb, null, self);
}

/**
 * Direct introducer reward.
 * 10 percent of Reward send to the Direct introducer for staking the amount by it's sponsor.
 * Reward is send through the main account.
 * Disable refer option when main account balance becomes zero.
 * @param {reward} number - reward for referral user
 * @param {address} string - Address of user which staked the amount.
 * @param {introducerAddress} string - Address of user which get reward and introduce address to ddk.
 * @param {transactionId} string - stake transaction id.
 * @author - Satish Joshi
 */

// Events
/**
 * Bounds scope to private transactionPool and modules
 * to private Transfer instance.
 * @implements module:transactions#Transfer~bind
 * @param {scope} scope - Loaded modules.
 */
Frogings.prototype.onBind = function (scope) {
    modules = {
        accounts: scope.accounts,
        transactions: scope.transactions
    };

    __private.transactionPool.bind(
        scope.accounts,
        scope.transactions,
        scope.loader
    );
    __private.assetTypes[transactionTypes.STAKE].bind(
        scope.accounts,
        scope.rounds,
        scope.blocks,
        scope.transactions
    );
};

__private.getMyDDKFrozen = async function (account) {
    return new Promise(async (resolve, reject) => {
        try {
            const resultFromCache = await cache.prototype.getJsonForKeyAsync(MY_STAKED_AMOUNT);

            if (resultFromCache !== null) {
                resolve(resultFromCache);
            }

            const row = await library.db.one(sql.getMyStakedAmount, { address: account.address });
            await cache.prototype.setJsonForKeyAsync(
                MY_STAKED_AMOUNT, row, MY_STAKED_AMOUNT_EXPIRE
            );
            resolve(row);
        } catch (err) {
            reject(err);
        }
    });
};

__private.getAllFreezeOrders = async function (account, req) {
    return new Promise(async (resolve, reject) => {
        try {
            const resultFromCache = await cache.prototype.getJsonForKeyAsync(ALL_FREEZE_ORDERS);

            if (resultFromCache !== null) {
                resolve(resultFromCache);
            }

            const row = await library.db.task(async (t) => {
                const count = await t.query(sql.getFrozeOrdersCount, { senderId: account.address });
                const freezeOrders = await t.query(sql.getFrozeOrders, {
                    senderId: account.address,
                    limit: req.body.limit,
                    offset: req.body.offset
                });
                return {
                    freezeOrders,
                    count: count.length ? count[0].count : 0
                };
            });
            await cache.prototype.setJsonForKeyAsync(
                ALL_FREEZE_ORDERS, row, ALL_FREEZE_ORDERS_EXPIRE
            );
            resolve(row);
        } catch (err) {
            reject(err);
        }
    });
};

__private.getAllActiveFreezeOrders = async function (account) {
    return new Promise(async (resolve, reject) => {
        try {
            const resultFromCache = await cache.prototype.getJsonForKeyAsync(ALL_ACTIVE_FREEZE_ORDERS);

            if (resultFromCache !== null) {
                resolve(resultFromCache);
            }

            const row = await library.db.query(sql.getActiveFrozeOrders, {
                senderId: account.address,
                currentTime: slots.getTime()
            });
            await cache.prototype.setJsonForKeyAsync(
                ALL_ACTIVE_FREEZE_ORDERS, row, ALL_ACTIVE_FREEZE_ORDERS_EXPIRE
            );
            resolve(JSON.stringify(row));
        } catch (err) {
            reject(err);
        }
    });
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Frogings.prototype.shared = {

    getCountStakeHoldersFromCache: async () => await cache.prototype.getJsonForKeyAsync(COUNT_ACTIVE_STAKE_HOLDERS_KEY),

    getCountStakeHoldersFromQuery: async () => await library.db.one(sql.countStakeholders),

    updateCountStakeHoldersCache: async value => await cache.prototype.setJsonForKeyAsync(
        COUNT_ACTIVE_STAKE_HOLDERS_KEY, value, COUNT_ACTIVE_STAKE_HOLDERS_EXPIRE
    ),

    async countStakeholders(req, cb) {
        try {
            let result = await self.shared.getCountStakeHoldersFromCache();
            if (result === null) {
                result = await self.shared.getCountStakeHoldersFromQuery();
                await self.shared.updateCountStakeHoldersCache(result);
            }
            return setImmediate(cb, null, {
                countStakeholders: result
            });
        } catch (err) {
            return setImmediate(cb, err);
        }
    },

    async totalDDKStaked(req, cb) {
        try {
            const resultFromCache = await cache.prototype.getJsonForKeyAsync(COUNT_TOTAL_DDK_STAKED);

            if (resultFromCache !== null) {
                return setImmediate(cb, null, { totalDDKStaked: resultFromCache });
            }

            const totalDDKStaked = await library.db.one(sql.getTotalStakedAmount);
            await cache.prototype.setJsonForKeyAsync(
                COUNT_TOTAL_DDK_STAKED, totalDDKStaked, COUNT_TOTAL_DDK_STAKED_EXPIRE
            );
            return setImmediate(cb, null, { totalDDKStaked });
        } catch (err) {
            return setImmediate(cb, err);
        }
    },

    getMyDDKFrozen(req, cb) {
        library.schema.validate(req.body, schema.getMyDDKFrozen, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }
            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);

            modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                if (!account || !account.address) {
                    return setImmediate(cb, 'Address of account not found');
                }

                __private.getMyDDKFrozen(account)
                    .then(row => setImmediate(cb, null, { totalDDKStaked: row }))
                    .catch(err => setImmediate(cb, err));
            });
        });
    },
    async getAllFreezeOrders(req, cb) {
        library.schema.validate(req.body, schema.getAllFreezeOrder, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }
            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);

            modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                if (!account || !account.address) {
                    return setImmediate(cb, 'Address of account not found');
                }

                __private.getAllFreezeOrders(account, req)
                    .then(row => setImmediate(cb, null, row))
                    .catch(err => setImmediate(cb, err));
            });
        });
    },

    getAllActiveFreezeOrders(req, cb) {
        library.schema.validate(req.body, schema.getAllActiveFreezeOrder, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }
            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);

            modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                if (!account || !account.address) {
                    return setImmediate(cb, 'Address of account not found');
                }

                __private.getAllActiveFreezeOrders(account)
                    .then(rows => setImmediate(cb, null, { freezeOrders: rows }))
                    .catch(err => setImmediate(cb, err));
            });
        });
    },

    addTransactionForFreeze(req, cb) {
        let accountData;
        library.schema.validate(req.body, schema.addTransactionForFreeze, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);

            if (req.body.publicKey) {
                if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
                    return setImmediate(cb, 'Invalid passphrase');
                }
            }

            library.balancesSequence.add((cb) => {
                if (
                    req.body.multisigAccountPublicKey &&
                    req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')
                ) {
                    modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }
                        accountData = account;

                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Multisignature account not found');
                        }

                        if (!account.multisignatures || !account.multisignatures) {
                            return setImmediate(cb, 'Account does not have multisignatures enabled');
                        }

                        if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                            return setImmediate(cb, 'Account does not belong to multisignature group');
                        }

                        modules.accounts.getAccount({ publicKey: keypair.publicKey }, (err, requester) => {
                            if (err) {
                                return setImmediate(cb, err);
                            }

                            if (!requester || !requester.publicKey) {
                                return setImmediate(cb, 'Requester not found');
                            }

                            if (requester.secondSignature && !req.body.secondSecret) {
                                return setImmediate(cb, 'Missing second passphrase');
                            }

                            if (requester.publicKey === account.publicKey) {
                                return setImmediate(cb, 'Invalid requester public key');
                            }

                            let secondKeypair = null;

                            if (requester.secondSignature) {
                                const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                secondKeypair = library.ed.makeKeypair(secondHash);
                            }

                            if (
                                (
                                    req.body.freezedAmount +
                                    (constants.fees.froze * req.body.freezedAmount) / 100 +
                                    parseInt(account.u_totalFrozeAmount)
                                ) > parseInt(account.u_balance)
                            ) {
                                return setImmediate(cb, 'Insufficient balance');
                            }

                            library.logic.transaction.create({
                                type: transactionTypes.STAKE,
                                freezedAmount: req.body.freezedAmount,
                                sender: account,
                                keypair,
                                secondKeypair,
                                requester: keypair
                            }).then((transactionStake) => {
                                modules.transactions.receiveTransactions([transactionStake], true, cb);
                            }).catch(e => setImmediate(cb, e.toString()));
                        });
                    });
                } else {
                    modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }
                        accountData = account;
                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Account not found');
                        }

                        if (account.secondSignature && !req.body.secondSecret) {
                            return setImmediate(cb, 'Missing second passphrase');
                        }

                        let secondKeypair = null;

                        if (account.secondSignature) {
                            const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                            secondKeypair = library.ed.makeKeypair(secondHash);
                        }

                        if (
                            (
                                req.body.freezedAmount +
                                (constants.fees.froze * req.body.freezedAmount) / 100 +
                                parseInt(account.u_totalFrozeAmount)
                            ) > parseInt(account.u_balance)
                        ) {
                            return setImmediate(cb, 'Insufficient balance');
                        }

                        library.logic.transaction.create({
                            type: transactionTypes.STAKE,
                            freezedAmount: req.body.freezedAmount,
                            sender: account,
                            keypair,
                            secondKeypair
                        }).then((transactionStake) => {
                            modules.transactions.receiveTransactions([transactionStake], true, cb);
                        }).catch(e => setImmediate(cb, e.toString()));
                    });
                }
            }, (err, transaction) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                library.network.io.sockets.emit('updateTotalStakeAmount', null);
                return setImmediate(cb, null, {
                    transaction: transaction[0],
                    referStatus: true
                });
            });
        });
    },

    getRewardHistory(req, cb) {
        const params = {};
        if (req.body.limit) {
            params.limit = req.body.limit;
        } else {
            params.limit = 5;
        }

        if (req.body.offset) {
            params.offset = req.body.offset;
        } else {
            params.offset = 0;
        }

        params.senderId = req.body.senderId;

        library.db.query(sql.getStakeRewardHistory, {
            senderId: params.senderId,
            offset: params.offset,
            limit: params.limit
        })
            .then(row => setImmediate(cb, null, {
                rewardHistory: row,
                count: row[0].rewards_count
            }))
            .catch(err => setImmediate(cb, err));
    }
};

// Export
module.exports = Frogings;

/** ************************************* END OF FILE ************************************ */
