import {default as NewTransactionPool, TransactionQueue} from 'src/logic/newTransactionPool';
import {Transaction, TransactionStatus} from "src/helpers/types";

const _ = require('lodash');
const async = require('async');
const speakeasy = require('speakeasy');
const constants = require('../helpers/constants.js');
const crypto = require('crypto');
const OrderBy = require('../helpers/orderBy.js');
const sandboxHelper = require('../helpers/sandbox.js');
const schema = require('../schema/transactions.js');
const sql = require('../sql/transactions.js');
const TransactionPool = require('../logic/transactionPool.js');
const transactionTypes = require('../helpers/transactionTypes.js');
const Transfer = require('../logic/transfer.js');
const slots = require('../helpers/slots');
const trsCache = require('memory-cache');

const expCache = new trsCache.Cache();
const Cache = require('./cache.js');
const BUFFER = require('../helpers/buffer.js');
const bignum = require('../helpers/bignum.js');


// Private fields
const __private: any = {};
const shared = {};
let modules;
let library;
let self;
const epochTime = 1451667600;

const TOTAL_TRS_COUNT = 'TOTAL_TRS_COUNT';
const TOTAL_TRS_COUNT_EXPIRE = 30; // seconds

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
class Transactions {

    [prorotype: string]: any;

    private newTransactionPool: NewTransactionPool;
    private transactionQueue: TransactionQueue;

    constructor(cb, scope) {
        library = {
            cache: scope.cache,
            config: scope.config,
            logger: scope.logger,
            db: scope.db,
            schema: scope.schema,
            ed: scope.ed,
            balancesSequence: scope.balancesSequence,
            logic: {
                transaction: scope.logic.transaction,
            },
            genesisblock: scope.genesisblock
        };

        self = this;

        __private.transactionPool = new TransactionPool(
            scope.config.broadcasts.broadcastInterval,
            scope.config.broadcasts.releaseLimit,
            scope.config.transactions.maxTxsPerQueue,
            scope.logic.transaction,
            scope.bus,
            scope.logger
        ) as any;

        this.newTransactionPool = new NewTransactionPool({
            transactionLogic: scope.logic.transaction,
            logger: scope.logger,
            db: scope.db
        });

        this.transactionQueue = new TransactionQueue({
            transactionLogic: scope.logic.transaction,
            transactionPool: this.newTransactionPool,
            logger: scope.logger,
            db: scope.db
        });

        __private.assetTypes[transactionTypes.SEND] = library.logic.transaction.attachAssetType(
            transactionTypes.SEND, new Transfer()
        );

        setImmediate(cb, null, self);
    }


    putInQueue(trs: Transaction): void {
        this.transactionQueue.set(trs);
    }

    async getUnconfirmedTransactionsForBlockGeneration(): Promise<Array<Transaction>> {
        return await this.newTransactionPool.getUnconfirmedTransactionsForBlockGeneration();
    }
}

/**
 * Get cached value for total number of transactions
 * @returns total count of transactions
 */
__private.getTotalTrsCountFromCache = async function () {
    return new Promise(async (resolve, reject) => {
        try {
            const resultFromCache = await Cache.prototype.getJsonForKeyAsync(TOTAL_TRS_COUNT);

            if (resultFromCache !== null) {
                resolve(Number(resultFromCache));
            }

            const row = await library.db.one(sql.count);
            const count = Number(row.count);

            await Cache.prototype.setJsonForKeyAsync(
                TOTAL_TRS_COUNT, count, TOTAL_TRS_COUNT_EXPIRE
            );
            resolve(count);
        } catch (err) {
            reject(err);
        }
    });
};

__private.getAddressByPublicKey = function (publicKey) {
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    const temp = Buffer.alloc(BUFFER.LENGTH.INT64);

    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    return `DDK${bignum.fromBuffer(temp).toString()}`;
};

// Private methods
/**
 * Counts totals and gets transaction list from `trs_list` view.
 * @private
 * @param {Object} filter
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | data: {transactions, count}
 */
__private.list = function (filter, cb) {
    const params: any = {};
    const where = [];
    const allowedFieldsMap = {
        id: 't."id" = ${id}',
        blockId: 't."blockId" = ${blockId}',
        senderPublicKey: 't."senderPublicKey" = ${senderPublicKey}',
        // TODO can be use in future
        // recipientPublicKey: 'm."recipientPublicKey" = ${recipientPublicKey}',
        // recipientPublicKeys: 'm."recipientPublicKey" IN (${recipientPublicKeys:csv})',
        senderId: 't."senderId" = ${senderId}',
        recipientId: 't."recipientId" = ${recipientId}',
        // TODO change request
        // height: 'b."height" = ${height}',
        // fromHeight: 'b."height" >= ${fromHeight}',
        // toHeight: 'b."height" <= ${toHeight}',
        // minConfirmations: 'confirmations >= ${minConfirmations}',
        fromTimestamp: 't."timestamp" >= ${fromTimestamp}',
        toTimestamp: 't."timestamp" <= ${toTimestamp}',
        senderIds: 't."senderId" IN (${senderIds:csv})',
        recipientIds: 't."recipientId" IN (${recipientIds:csv})',
        senderPublicKeys: 't."senderPublicKey" IN (${senderPublicKeys:csv})',
        type: 't."type" = ${type}',

        limit: null,
        offset: null,
        orderBy: null,
        // FIXME: Backward compatibility, should be removed after transitional period
        ownerAddress: null,
        ownerPublicKey: null
    };
    let owner = '';
    let isFirstWhere = true;

    const processParams = function (value, key) {
        const field = String(key).split(':');
        if (field.length === 1) {
            // Only field identifier, so using default 'OR' condition
            field.unshift('OR');
        } else if (field.length === 2) {
            // Condition supplied, checking if correct one
            if (_.includes(['or', 'and'], field[0].toLowerCase())) {
                field[0] = field[0].toUpperCase();
            } else {
                throw new Error(`Incorrect condition [${field[0]}] for field: ${field[1]}`);
            }
        } else {
            // Invalid parameter 'x:y:z'
            throw new Error(`Invalid parameter supplied: ${key}`);
        }

        // Mutating parametres when unix timestamp is supplied
        if (_.includes(['fromUnixTime', 'toUnixTime'], field[1])) {
            // ddk epoch is 1464109200 as unix timestamp
            value -= constants.epochTime.getTime() / 1000;
            field[1] = field[1].replace('UnixTime', 'Timestamp');
        }

        if (!_.includes(_.keys(allowedFieldsMap), field[1])) {
            throw new Error(`Parameter is not supported: ${field[1]}`);
        }

        // Checking for empty parameters, 0 is allowed for few
        if (!value && !(value === 0 && _.includes(['fromTimestamp', 'minAmount', 'minConfirmations', 'type', 'offset'], field[1]))) {
            throw new Error(`Value for parameter [${field[1]}] cannot be empty`);
        }

        if (allowedFieldsMap[field[1]]) {
            if (field[1] === 'senderPublicKey') {
                field[1] = 'senderId';
                value = __private.getAddressByPublicKey(filter.senderPublicKey);
            }

            where.push((!isFirstWhere ? (`${field[0]} `) : '') + allowedFieldsMap[field[1]]);
            params[field[1]] = value;
            isFirstWhere = false;
        }
    };

    // Generate list of fields with conditions
    try {
        _.each(filter, processParams);
    } catch (err) {
        return setImmediate(cb, err.message);
    }

    // FIXME: Backward compatibility, should be removed after transitional period
    if (filter.ownerAddress && filter.ownerPublicKey) {
        const ownerAddressAsSender = __private.getAddressByPublicKey(filter.ownerPublicKey);
        owner = '(t."senderId" = ${ownerAddressAsSender} OR t."recipientId" = ${ownerAddressAsRecipient})';
        params.ownerAddressAsSender = ownerAddressAsSender;
        params.ownerAddressAsRecipient = filter.ownerAddress;
    }

    if (!filter.limit) {
        params.limit = 100;
    } else {
        params.limit = Math.abs(filter.limit);
    }

    if (!filter.offset) {
        params.offset = 0;
    } else {
        params.offset = Math.abs(filter.offset);
    }

    if (params.limit > 1000) {
        return setImmediate(cb, 'Invalid limit, maximum is 1000');
    }

    const orderBy = OrderBy(
        filter.orderBy, {
            sortFields: sql.sortFields,
            quoteField: false,
            fieldPrefix(sortField) {
                if (['height'].indexOf(sortField) > -1) {
                    return `b.${sortField}`;
                } else if (['confirmations'].indexOf(sortField) > -1) {
                    return sortField;
                }
                return `t."t_${sortField}"`;
            }
        }
    );

    if (orderBy.error) {
        return setImmediate(cb, orderBy.error);
    }

    library.db.query(sql.list({
        where,
        owner,
        sortField: orderBy.sortField,
        sortMethod: orderBy.sortMethod
    }), params).then(async (rows) => {
        const count = rows.length
            ? rows[0].total_rows !== undefined
                ? rows[0].total_rows
                : await __private.getTotalTrsCountFromCache()
            : 0;

        library.db.query(sql.getDelegateNames)
            .then((delegates) => {
                // TODO remove that logic if count delegates will be more than 100
                // https://trello.com/c/yQ6JC62S/214-remove-logic-add-username-for-transactions-get-if-count-delegates-will-be-more-than-100
                const delegatesMap = Object.assign({}, constants.DEFAULT_USERS);

                delegates.forEach((delegate) => {
                    delegatesMap[delegate.m_address] = delegate.m_username;
                });

                const transactions = rows.map((row) => {
                    const trs = library.logic.transaction.dbRead(row);
                    trs.senderName = delegatesMap[trs.senderId];
                    trs.recipientName = delegatesMap[trs.recipientId];
                    return trs;
                });

                const data = {
                    transactions,
                    count
                };

                return setImmediate(cb, null, data);
            })
            .catch(err => setImmediate(cb, err.message));
    }).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'Transactions#list error');
    });
};

/**
 * Gets transaction by id from `trs_list` view.
 * @private
 * @param {string} id
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | data: {transaction}
 */
__private.getById = function (id, cb) {
    library.db.query(sql.getById, { id }).then((rows) => {
        if (!rows.length) {
            return setImmediate(cb, `Transaction not found: ${id}`);
        }

        const transacton = library.logic.transaction.dbRead(rows[0]);

        return setImmediate(cb, null, transacton);
    }).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'Transactions#getById error');
    });
};

/**
 * Gets votes by transaction id from `votes` table.
 * @private
 * @param {transaction} transaction
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | data: {added, deleted}
 */
__private.getVotesById = function (transaction, cb) {
    library.db.query(sql.getVotesById, { id: transaction.id }).then((rows) => {
        if (!rows.length) {
            return setImmediate(cb, `Transaction not found: ${transaction.id}`);
        }

        const votes = rows[0].votes.split(',');
        const added = [];
        const deleted = [];

        for (let i = 0; i < votes.length; i++) {
            if (votes[i].substring(0, 1) === '+') {
                added.push(votes[i].substring(1));
            } else if (votes[i].substring(0, 1) === '-') {
                deleted.push(votes[i].substring(1));
            }
        }

        transaction.votes = { added, deleted };

        return setImmediate(cb, null, transaction);
    }).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'Transactions#getVotesById error');
    });
};

/**
 * Gets transaction by calling parameter method.
 * @private
 * @param {Object} method
 * @param {Object} req
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | data: {transaction}
 */
__private.getPooledTransaction = function (method, req, cb) {
    library.schema.validate(req.body, schema.getPooledTransaction, (err) => {
        if (err) {
            return setImmediate(cb, err[0].message);
        }

        const transaction = self[method](req.body.id);

        if (!transaction) {
            return setImmediate(cb, 'Transaction not found');
        }

        return setImmediate(cb, null, { transaction });
    });
};

/**
 * Gets transactions by calling parameter method.
 * Filters by senderPublicKey or address if they are present.
 * @private
 * @param {Object} method
 * @param {Object} req
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | data: {transactions, count}
 */
__private.getPooledTransactions = function (method, req, cb) {
    library.schema.validate(req.body, schema.getPooledTransactions, (err) => {
        if (err) {
            return setImmediate(cb, err[0].message);
        }

        const transactions = self[method](true);
        let i,
            toSend = [];

        if (req.body.senderPublicKey || req.body.address) {
            for (i = 0; i < transactions.length; i++) {
                if (transactions[i].senderPublicKey === req.body.senderPublicKey || transactions[i].recipientId === req.body.address) {
                    toSend.push(transactions[i]);
                }
            }
        } else {
            for (i = 0; i < transactions.length; i++) {
                toSend.push(transactions[i]);
            }
        }

        return setImmediate(cb, null, { transactions: toSend, count: transactions.length });
    });
};

// Public methods
/**
 * Check if transaction is in pool
 * @param {string} id
 * @return {function} Calls transactionPool.transactionInPool
 */
Transactions.prototype.transactionInPool = function (id) {
    return __private.transactionPool.transactionInPool(id);
};

/**
 * @param {string} id
 * @return {function} Calls transactionPool.getUnconfirmedTransaction
 */
Transactions.prototype.getUnconfirmedTransaction = function (id) {
    return __private.transactionPool.getUnconfirmedTransaction(id);
};

/**
 * @param {string} id
 * @return {function} Calls transactionPool.getQueuedTransaction
 */
Transactions.prototype.getQueuedTransaction = function (id) {
    return __private.transactionPool.getQueuedTransaction(id);
};

/**
 * @param {string} id
 * @return {function} Calls transactionPool.getMultisignatureTransaction
 */
Transactions.prototype.getMultisignatureTransaction = function (id) {
    return __private.transactionPool.getMultisignatureTransaction(id);
};

/**
 * Gets unconfirmed transactions based on limit and reverse option.
 * @param {boolean} reverse
 * @param {number} limit
 * @return {function} Calls transactionPool.getUnconfirmedTransactionList
 */
Transactions.prototype.getUnconfirmedTransactionList = function (reverse, limit) {
    return __private.transactionPool.getUnconfirmedTransactionList(reverse, limit);
};

/**
 * Gets queued transactions based on limit and reverse option.
 * @param {boolean} reverse
 * @param {number} limit
 * @return {function} Calls transactionPool.getQueuedTransactionList
 */
Transactions.prototype.getQueuedTransactionList = function (reverse, limit) {
    return __private.transactionPool.getQueuedTransactionList(reverse, limit);
};

/**
 * Gets multisignature transactions based on limit and reverse option.
 * @param {boolean} reverse
 * @param {number} limit
 * @return {function} Calls transactionPool.getQueuedTransactionList
 */
Transactions.prototype.getMultisignatureTransactionList = function (reverse, limit) {
    return __private.transactionPool.getMultisignatureTransactionList(reverse, limit);
};

/**
 * Gets unconfirmed, multisignature and queued transactions based on limit and reverse option.
 * @param {boolean} reverse
 * @param {number} limit
 * @return {function} Calls transactionPool.getMergedTransactionList
 */
Transactions.prototype.getMergedTransactionList = function (reverse, limit) {
    return __private.transactionPool.getMergedTransactionList(reverse, limit);
};

/**
 * Removes transaction from unconfirmed, queued and multisignature.
 * @param {string} id
 * @return {function} Calls transactionPool.removeUnconfirmedTransaction
 */
Transactions.prototype.removeUnconfirmedTransaction = function (id) {
    return __private.transactionPool.removeUnconfirmedTransaction(id);
};

/**
 * Checks kind of unconfirmed transaction and process it, resets queue
 * if limit reached.
 * @param {transaction} transaction
 * @param {Object} broadcast
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.processUnconfirmedTransaction
 */
Transactions.prototype.processUnconfirmedTransaction = function (transaction, broadcast, cb) {
    return __private.transactionPool.processUnconfirmedTransaction(transaction, broadcast, cb);
};

/**
 * Gets unconfirmed transactions list and applies unconfirmed transactions.
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.applyUnconfirmedList
 */
Transactions.prototype.applyUnconfirmedList = function (cb) {
    return __private.transactionPool.applyUnconfirmedList(cb);
};

/**
 * Applies unconfirmed list to unconfirmed Ids.
 * @param {string[]} ids
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.applyUnconfirmedIds
 */
Transactions.prototype.applyUnconfirmedIds = function (ids, cb) {
    return __private.transactionPool.applyUnconfirmedIds(ids, cb);
};

/**
 * Undoes unconfirmed list from queue.
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.undoUnconfirmedList
 */
Transactions.prototype.undoUnconfirmedList = function (cb) {
    return __private.transactionPool.undoUnconfirmedList(cb);
};

/**
 * Applies confirmed transaction.
 * @implements {logic.transaction.apply}
 * @param {transaction} transaction
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 */
Transactions.prototype.apply = function (transaction, block, sender, cb) {
    library.logger.debug('Applying confirmed transaction', transaction.id);
    library.logic.transaction.apply(transaction, block, sender, cb);
};

/**
 * Undoes confirmed transaction.
 * @implements {logic.transaction.undo}
 * @param {transaction} transaction
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 */
Transactions.prototype.undo = function (transaction, block, sender, cb) {
    library.logger.debug('Undoing confirmed transaction', transaction.id);
    library.logic.transaction.undo(transaction, block, sender, cb);
};

/**
 * Gets requester if requesterPublicKey and calls applyUnconfirmed.
 * @implements {modules.accounts.getAccount}
 * @implements {logic.transaction.applyUnconfirmed}
 * @param {transaction} transaction
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} for errors
 */
Transactions.prototype.applyUnconfirmed = function (transaction, sender, cb) {
    library.logger.debug('Applying unconfirmed transaction', transaction.id);

    if (!sender && transaction.blockId !== library.genesisblock.block.id) {
        return setImmediate(cb, 'Invalid block id');
    }
    if (transaction.requesterPublicKey) {
        modules.accounts.getAccount({ publicKey: transaction.requesterPublicKey }, (err, requester) => {
            if (err) {
                return setImmediate(cb, err);
            }

            if (!requester) {
                return setImmediate(cb, 'Requester not found');
            }

            library.logic.transaction.applyUnconfirmed(transaction, sender, requester, cb);
        });
    } else {
        library.logic.transaction.applyUnconfirmed(transaction, sender, cb);
    }
};

/**
 * Validates account and Undoes unconfirmed transaction.
 * @implements {modules.accounts.getAccount}
 * @implements {logic.transaction.undoUnconfirmed}
 * @param {transaction} transaction
 * @param {function} cb
 * @return {setImmediateCallback} For error
 */
Transactions.prototype.undoUnconfirmed = function (transaction, cb) {
    library.logger.debug('Undoing unconfirmed transaction', transaction.id);

    modules.accounts.getAccount({ publicKey: transaction.senderPublicKey }, (err, sender) => {
        if (err) {
            return setImmediate(cb, err);
        }
        library.logic.transaction.undoUnconfirmed(transaction, sender, cb);
    });
};

/**
 * Receives transactions
 * @param {transaction[]} transactions
 * @param {Object} broadcast
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.receiveTransactions
 */
Transactions.prototype.receiveTransactions = function (transactions, broadcast, cb) {
    return __private.transactionPool.receiveTransactions(transactions, broadcast, cb);
};

/**
 * Fills pool.
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.fillPool
 */
Transactions.prototype.fillPool = function (cb) {
    return __private.transactionPool.fillPool(cb);
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {*} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Transactions.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
Transactions.prototype.isLoaded = function () {
    return !!modules;
};

// Events
/**
 * Bounds scope to private transactionPool and modules
 * to private Transfer instance.
 * @implements module:transactions#Transfer~bind
 * @param {scope} scope - Loaded modules.
 */
Transactions.prototype.onBind = function (scope) {
    modules = {
        accounts: scope.accounts,
        transactions: scope.transactions,
    };

    __private.transactionPool.bind(
        scope.accounts,
        scope.transactions,
        scope.loader
    );
    __private.assetTypes[transactionTypes.SEND].bind(
        scope.accounts,
        scope.rounds
    );
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Transactions.prototype.internal = {
    getTransactionHistory(req, cb) {
        if (expCache.get('trsHistoryCache')) {
            return setImmediate(cb, null, {
                success: true,
                trsData: expCache.get('trsHistoryCache'),
                info: 'caching'
            });
        }
        const fortnightBack = new Date(+new Date() - 12096e5);

        fortnightBack.setHours(0, 0, 0, 0);

        const startTimestamp = slots.getTime(fortnightBack);

        const endDate = new Date(+new Date() - (60 * 60 * 24 * 1000));

        endDate.setHours(0, 0, 0, 0);

        const endTimestamp = slots.getTime(endDate);

        library.db.query(sql.getTransactionHistory, {
            startTimestamp: startTimestamp + epochTime,
            endTimestamp: endTimestamp + epochTime,
            epochTime
        })
            .then((trsHistory) => {
                const leftTime = (24 - new Date().getUTCHours()) * 60 * 60 * 1000;

                expCache.put('trsHistoryCache', trsHistory, leftTime);

                return setImmediate(cb, null, {
                    success: true,
                    trsData: trsHistory
                });
            })
            .catch(err => setImmediate(cb, {
                success: false,
                err
            }));
    }
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Transactions.prototype.shared = {
    getTransactions(req, cb) {
        async.waterfall([
            function (waterCb) {
                const params = {};
                const pattern = /(and|or){1}:/i;

                // Filter out 'and:'/'or:' from params to perform schema validation
                _.each(req.body, (value, key) => {
                    const param = String(key).replace(pattern, '');
                    // Dealing with array-like parameters (csv comma separated)
                    if (_.includes(['senderIds', 'recipientIds', 'senderPublicKeys', 'recipientPublicKeys'], param)) {
                        value = String(value).split(',');
                        req.body[key] = value;
                    }
                    params[param] = value;
                });

                library.schema.validate(params, schema.getTransactions, (err) => {
                    if (err) {
                        return setImmediate(waterCb, err[0].message);
                    }
                    return setImmediate(waterCb, null);
                });
            },
            function (waterCb) {
                __private.list(req.body, (err, data) => {
                    if (err) {
                        return setImmediate(waterCb, `Failed to get transactions: ${err}`);
                    }
                    return setImmediate(waterCb, null, { transactions: data.transactions, count: data.count });
                });
            }
        ], (err, res) => setImmediate(cb, err, res));
    },

    getTransaction(req, cb) {
        library.schema.validate(req.body, schema.getTransaction, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            __private.getById(req.body.id, (err, transaction) => {
                if (!transaction || err) {
                    return setImmediate(cb, 'Transaction not found');
                }

                if (transaction.type === transactionTypes.VOTE) {
                    __private.getVotesById(transaction, (err, transaction) => setImmediate(cb, null, { transaction }));
                } else {
                    return setImmediate(cb, null, { transaction });
                }
            });
        });
    },

    getTransactionsCount(req, cb) {
        library.db.query(sql.count).then(transactionsCount => setImmediate(cb, null, {
            confirmed: transactionsCount[0].count,
            multisignature: __private.transactionPool.multisignature.transactions.length,
            unconfirmed: __private.transactionPool.unconfirmed.transactions.length,
            queued: __private.transactionPool.queued.transactions.length
        }), err => setImmediate(cb, err));
    },

    getQueuedTransaction(req, cb) {
        return __private.getPooledTransaction('getQueuedTransaction', req, cb);
    },

    getQueuedTransactions(req, cb) {
        return __private.getPooledTsrcransactions('getQueuedTransactionList', req, cb);
    },

    getMultisignatureTransaction(req, cb) {
        return __private.getPooledTransaction('getMultisignatureTransaction', req, cb);
    },

    getMultisignatureTransactions(req, cb) {
        return __private.getPooraledTransactions('getMultisignatureTransactionList', req, cb);
    },

    getUnconfirmedTransaction(req, cb) {
        return __private.getPooledTransaction('getUnconfirmedTransaction', req, cb);
    },

    getUnconfirmedTransactions(req, cb) {
        return __private.getPooledTransactions('getUnconfirmedTransactionList', req, cb);
    },

    addTransactions(req, cb) {
        library.schema.validate(req.body, schema.addTransactions, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }
            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);
            const publicKey = keypair.publicKey.toString('hex');

            if (req.body.publicKey) {
                if (publicKey !== req.body.publicKey) {
                    return setImmediate(cb, 'Invalid passphrase');
                }
            }

            library.cache.client.get(`2fa_user_${modules.accounts.generateAddressByPublicKey(publicKey)}`, (err, userTwoFaCred) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                if (userTwoFaCred) {
                    userTwoFaCred = JSON.parse(userTwoFaCred);
                    if (userTwoFaCred.twofactor.secret) {
                        const verified = speakeasy.totp.verify({
                            secret: userTwoFaCred.twofactor.secret,
                            encoding: 'base32',
                            token: req.body.otp,
                            window: 6
                        });
                        if (!verified) {
                            return setImmediate(cb, 'Invalid OTP!. Please enter valid OTP to SEND Transaction');
                        }
                    }
                }

                const query = { address: req.body.recipientId };

                library.balancesSequence.add((cb) => {
                    modules.accounts.getAccount(query, (err, recipient) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }

                        const recipientId = recipient ? recipient.address : req.body.recipientId;

                        if (!recipientId) {
                            return setImmediate(cb, 'Invalid recipient');
                        }

                        if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== publicKey) {
                            modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, (err, account) => {
                                if (err) {
                                    return setImmediate(cb, err);
                                }

                                if (!account || !account.publicKey) {
                                    return setImmediate(cb, 'Multisignature account not found');
                                }

                                if (!Array.isArray(account.multisignatures)) {
                                    return setImmediate(cb, 'Account does not have multisignatures enabled');
                                }

                                if (account.multisignatures.indexOf(publicKey) < 0) {
                                    return setImmediate(cb, 'Account does not belong to multisignature group');
                                }

                                modules.accounts.getAccount({ publicKey: keypair.publicKey }, (err) => {
                                    if (err) {
                                        return setImmediate(cb, err);
                                    }

                                    if (!account || !account.publicKey) {
                                        return setImmediate(cb, 'Account not found');
                                    }

                                    if (account.secondSignature && !req.body.secondSecret) {
                                        return setImmediate(cb, 'Missing second passphrase');
                                    }

                                    if (account.address == req.body.recipientId) {
                                        return setImmediate(cb, 'Sender and Recipient can\'t be same');
                                    }

                                    let secondKeypair = null;

                                    if (account.secondSignature) {
                                        const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                        secondKeypair = library.ed.makeKeypair(secondHash);
                                    }

                                    library.logic.transaction.create({
                                        type: transactionTypes.SEND,
                                        amount: req.body.amount,
                                        sender: account,
                                        recipientId,
                                        keypair,
                                        secondKeypair
                                    }).then((transactionReferSend) => {
                                        transactionReferSend.status = TransactionStatus.CREATED;
                                        try {
                                            modules.transactions.putInQueue(transactionReferSend);
                                        } catch (e) {
                                            self.scope.logger.error(`putInQueue ${e.stack}`);
                                        }

                                        return setImmediate(cb, null, [transactionReferSend]);
                                    }).catch(e => setImmediate(cb, e.toString()));
                                });
                            });
                        } else {
                            modules.accounts.setAccountAndGet({ publicKey: publicKey }, (err, account) => {
                                if (err) {
                                    return setImmediate(cb, err);
                                }

                                if (!account || !account.publicKey) {
                                    return setImmediate(cb, 'Account not found');
                                }

                                if (account.secondSignature && !req.body.secondSecret) {
                                    return setImmediate(cb, 'Missing second passphrase');
                                }

                                if (account.address == req.body.recipientId) {
                                    return setImmediate(cb, 'Sender and Recipient can\'t be same');
                                }

                                let secondKeypair = null;

                                if (account.secondSignature) {
                                    const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                    secondKeypair = library.ed.makeKeypair(secondHash);
                                }
                                library.logic.transaction.create({
                                    type: transactionTypes.SEND,
                                    amount: req.body.amount,
                                    sender: account,
                                    recipientId,
                                    keypair,
                                    secondKeypair
                                }).then((transactionReferSend) => {
                                    transactionReferSend.status = TransactionStatus.CREATED;
                                    modules.transactions.putInQueue(transactionReferSend);
                                    return setImmediate(cb, null, [transactionReferSend]);
                                }).catch(e => setImmediate(cb, e.toString()));
                            });
                        }
                    });
                }, (err, transaction) => {
                    if (err) {
                        return setImmediate(cb, err);
                    }

                    return setImmediate(cb, null, { transactionId: transaction[0].id });
                });
            });
        });
    }
};

// Export
// module.exports = Transactions;
export default Transactions;

/** ************************************* END OF FILE ************************************ */
