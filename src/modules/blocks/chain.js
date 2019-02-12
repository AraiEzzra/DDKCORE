const { transactionSortFunc } = require('src/helpers/transaction.utils');
const { getOrCreateAccount } = require('src/helpers/account.utils');

const async = require('async');
const transactionTypes = require('../../helpers/transactionTypes.js');

const _ = require('lodash');
const Inserts = require('../../helpers/inserts.js');
const sql = require('../../sql/blocks.js');
const utils = require('../../utils');

let modules;
let library;
let self;
const __private = {};

/**
 * Initializes library.
 * @memberof module:blocks
 * @class
 * @classdesc Main Chain logic.
 * Allows set information.
 * @param {Object} logger
 * @param {Block} block
 * @param {Transaction} transaction
 * @param {Database} db
 * @param {Object} genesisblock
 * @param {bus} bus
 * @param {Sequence} balancesSequence
 */
function Chain(logger, block, transaction, db, genesisblock, bus, balancesSequence) {
    library = {
        logger,
        db,
        genesisblock,
        bus,
        balancesSequence,
        logic: {
            block,
            transaction,
        },
    };
    self = this;

    library.logger.trace('Blocks->Chain: Submodule initialized.');
    return self;
}

/**
 * Save genesis block to database
 *
 * @async
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 */
Chain.prototype.saveGenesisBlock = async () => {
    // Check if genesis block ID already exists in the database
    // FIXME: Duplicated, there is another SQL query that we can use for that
    const rows = await library.db.query(sql.getGenesisBlockId, { id: library.genesisblock.block.id });
    const blockId = rows.length && rows[0].id;

    if (!blockId) {
        await self.newApplyGenesisBlock(library.genesisblock.block, false, true);
    }
};
Chain.prototype.newSaveBlock = async (block) => {
    try {
        await library.db.tx(async (t) => {
            const promise = library.logic.block.dbSave(block);
            const inserts = new Inserts(promise, promise.values);

            const promises = [t.none(inserts.template(), promise.values)];
            // Exec inserts as batch
            await t.batch(promises);
        });
    } catch (e) {
        library.logger.error(`[Chain][saveBlock][tx]: ${e}`);
        library.logger.error(`[Chain][saveBlock][tx][stack]: \n ${e.stack}`);
    }
};

Chain.prototype.saveTransaction = async (transaction) => {
    try {
        await library.db.tx(async (t) => {
            const promises = await library.logic.transaction.dbSave(transaction);
            const queries = promises.map(promise => {
                const inserts = new Inserts(promise, promise.values);
                return t.none(inserts.template(), promise.values);
            });
            await t.batch(queries);
        });
    } catch (error) {
        library.logger.error(`[Chain][saveTransaction][tx]: ${error}`);
        library.logger.error(`[Chain][saveTransaction][tx][stack]:\n${error.stack}`);
    }
};

__private.newAfterSave = async (block) => {
    library.bus.message('transactionsSaved', block.transactions);
    for (const trs of block.transactions) {
        try {
            await library.logic.transaction.afterSave(trs);
        } catch (e) {
            library.logger.error(`[Chain][afterSave]: ${e}`);
            library.logger.error(`[Chain][afterSave][stack]: \n ${e.stack}`);
        }
    }
};

/**
 * Build a sequence of transaction queries
 * // FIXME: Processing here is not clean
 *
 * @private
 * @method promiseTransactions
 * @param  {Object} t SQL connection object
 * @param  {Object} block Full normalized block
 * @param  {Object} blockPromises Not used
 * @return {Object} t SQL connection object filled with inserts
 * @throws Will throw 'Invalid promise' when no promise, promise.values or promise.table
 */
__private.promiseTransactions = async (t, block) => {
    if (_.isEmpty(block.transactions)) {
        return t;
    }

    const transactionIterator = async (transaction) => {
        // Apply block ID to transaction
        transaction.blockId = block.id;
        // Create bytea fileds (buffers), and returns pseudo-row promise-like object
        /* if(block.height === 1){
         transaction.timestamp=slots.getTime();
         } */

        return library.logic.transaction.dbSave(transaction);
    };

    const promiseGrouper = (promise) => {
        if (promise && promise.table) {
            return promise.table;
        }
        throw 'Invalid promise';
    };

    const typeIterator = (type) => {
        let values = [];
        _.each(type, (promise) => {
            if (promise && promise.values) {
                values = values.concat(promise.values);
            } else {
                throw 'Invalid promise';
            }
        });

        // Initialize insert helper
        const inserts = new Inserts(type[0], values, true);
        // Prepare insert SQL query
        t.none(inserts.template(), inserts);
    };

    const promises = [];
    for (const trs of block.transactions) {
        promises.push(...await transactionIterator(trs));
    }
    _.each(_.groupBy(promises, promiseGrouper), typeIterator);

    return t;
};

/**
 * Deletes block from blocks table
 *
 * @private
 * @async
 * @method deleteBlock
 * @param  {number}   blockId ID of block to delete
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err String if SQL error occurred, null if success
 */
Chain.prototype.deleteBlock = function (blockId, cb) {
    // Delete block with ID from blocks table
    // WARNING: DB_WRITE
    library.db.none(sql.deleteBlock, { id: blockId })
        .then(() => {
            utils.deleteDocumentByQuery({
                index: 'blocks_list',
                type: 'blocks_list',
                body: {
                    query: {
                        term: { b_id: blockId }
                    }
                }
            });

            return setImmediate(cb);
        })
        .catch((err) => {
            library.logger.error(
                `Error Message : ${err.message}, Error query : ${err.query}, Error stack : ${err.stack}`
            );
            return setImmediate(cb, 'Blocks#deleteBlock error');
        });
};

/**
 * Deletes all blocks with height >= supplied block ID
 *
 * @public
 * @async
 * @method deleteAfterBlock
 * @param  {number}   blockId ID of block to begin with
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err SQL error
 * @return {Object}   cb.res SQL response
 */
Chain.prototype.deleteAfterBlock = function (blockId, cb) {
    library.db.query(sql.deleteAfterBlock, { id: blockId })
        .then(res => setImmediate(cb, null, res))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Blocks#deleteAfterBlock error');
        });
};

Chain.prototype.deleteAfterBlock = function (blockId, cb) {
    library.db.query(sql.deleteAfterBlock, { id: blockId })
        .then(res => setImmediate(cb, null, res))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Blocks#deleteAfterBlock error');
        });
};


/**
 * Apply genesis block's transactions to blockchain
 *
 * @private
 * @async
 * @method applyGenesisBlock
 * @param  {Object}   block Full normalized genesis block
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 */
Chain.prototype.newApplyGenesisBlock = async (block, verify, save) => {
    block.transactions = block.transactions.sort(transactionSortFunc);
    try {
        library.logger.info('[Chain][applyGenesisBlock] Genesis block loading');
        await modules.blocks.verify.newProcessBlock(block, false, save, null, verify, false);
    } catch (e) {
        library.logger.error(`[Chain][applyGenesisBlock] ${e}`);
        library.logger.error(`[Chain][applyGenesisBlock][stack] ${e.stack}`);
    }
};

Chain.prototype.newApplyBlock = async (block, broadcast, keyPair, saveBlock, tick) => {
    // Prevent shutdown during database writes.
    modules.blocks.isActive.set(true);

    if (keyPair) {
        library.logic.block.addPayloadHash(block, keyPair);
    }

    if (saveBlock) {
        await self.newSaveBlock(block);
    }

    for (const trs of block.transactions) {
        const sender = await getOrCreateAccount(library.db, trs.senderPublicKey);
        await library.logic.transaction.newApply(trs, block, sender);

        if (saveBlock) {
            trs.blockId = block.id;
            await self.saveTransaction(trs);
        }
    }

    if (saveBlock) {
        await __private.newAfterSave(block);
        library.logger.debug(`Block applied correctly with ${block.transactions.length} transactions`);
    }

    modules.blocks.lastBlock.set(block);
    // TODO: fix broadcast onNewBlock
    // https://trello.com/c/573v81yz/245-fix-broadcast-on-new-block
    library.bus.message('newBlock', block, false);

    if (tick) {
        await (new Promise((resolve, reject) => modules.rounds.tick(block, (err, message) => {
            if (err) {
                library.logger.error(`[Chain][applyBlock][tick]: ${err}`);
                library.logger.error(`[Chain][applyBlock][tick][stack]: \n ${err.stack}`);
                reject(err);
            }
            library.logger.debug(`[Chain][applyBlock][tick] message: ${message}`);
            resolve();
        })));
    }
    block = null;
};

/**
 * Deletes last block, undo transactions, recalculate round
 *
 * @private
 * @async
 * @method popLastBlock
 * @param  {Function} cbPopLastBlock Callback function
 * @return {Function} cbPopLastBlock Callback function from params (through setImmediate)
 * @return {Object}   cbPopLastBlock.err Error
 * @return {Object}   cbPopLastBlock.obj New last block
 */
__private.popLastBlock = function (oldLastBlock, cbPopLastBlock) {
    library.logger.debug(`[Chain][popLastBlock] block: ${JSON.stringify(oldLastBlock)}`);
    // Execute in sequence via balancesSequence
    library.balancesSequence.add((cbAdd) => {
        let lastBlock = modules.blocks.lastBlock.get();
        if (oldLastBlock.id !== lastBlock.id) {
            library.logger.error(`[Chain][popLastBlock] Block ${oldLastBlock.id} is not last`);
            return setImmediate(cbAdd, `Block is not last: ${JSON.stringify(oldLastBlock)}`, lastBlock);
        }

        // Load previous block from full_blocks_list table
        // TODO: Can be inefficient, need performnce tests
        modules.blocks.utils.loadBlocksPart(oldLastBlock.previousBlock, (err, previousBlock) => {
            if (err) {
                return setImmediate(cbAdd, err || 'previousBlock is null');
            }

            // Reverse order of transactions in last blocks...
            async.eachSeries(oldLastBlock.transactions.reverse(), (transaction, eachSeriesCb) => {
                async.series([
                    function (seriesCb) {
                        modules.transactions.undo(transaction, seriesCb);
                    },
                    function (seriesCb) {
                        modules.transactions.undoUnconfirmed(transaction, seriesCb);
                    }
                ], eachSeriesCb);
            }, (errorUndo) => {
                if (errorUndo) {
                    // Fatal error, memory tables will be inconsistent
                    library.logger.error('Failed to undo transactions', errorUndo);

                    return process.exit(0);
                }

                // Perform backward tick on rounds
                // WARNING: DB_WRITE
                modules.rounds.backwardTick(oldLastBlock, previousBlock, (err) => {
                    if (err) {
                        // Fatal error, memory tables will be inconsistent
                        library.logger.error('Failed to perform backwards tick', err);

                        return process.exit(0);
                    }

                    // Delete last block from blockchain
                    // WARNING: Db_WRITE
                    self.deleteBlock(oldLastBlock.id, (errDeleteBlock) => {
                        if (errDeleteBlock) {
                            // Fatal error, memory tables will be inconsistent
                            library.logger.error('Failed to delete block', errDeleteBlock);

                            return process.exit(0);
                        }

                        return setImmediate(cbAdd, null, previousBlock);
                    });
                });
            });
        });
    }, cbPopLastBlock);
};

/**
 * Deletes last block
 *
 * @public
 * @async
 * @method deleteLastBlock
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 * @return {Object}   cb.obj New last block
 */
Chain.prototype.deleteLastBlock = function (cb) {
    let lastBlock = modules.blocks.lastBlock.get();
    library.logger.warn(`Deleting last block: ${JSON.stringify(lastBlock)}`);

    if (lastBlock.height === 1) {
        return setImmediate(cb, 'Cannot delete genesis block');
    }

    // Delete last block, replace last block with previous block, undo things
    __private.popLastBlock(lastBlock, (err, newLastBlock) => {
        modules.transactions.lockTransactionPoolAndQueue();
        if (err) {
            library.logger.error(`Error deleting last block: ${JSON.stringify(lastBlock)}, message: ${err}`);
        } else {
            modules.transactions.returnToQueueConflictedTransactionFromPool(lastBlock.transactions);
            // Replace last block with previous
            lastBlock = modules.blocks.lastBlock.set(newLastBlock);
        }
        modules.transactions.unlockTransactionPoolAndQueue();
        return setImmediate(cb, err, lastBlock);
    });
};

/**
 * Recover chain - wrapper for deleteLastBlock
 *
 * @private
 * @async
 * @method recoverChain
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 */
Chain.prototype.recoverChain = function (cb) {
    library.logger.warn('Chain comparison failed, starting recovery');
    self.deleteLastBlock((err, newLastBlock) => {
        if (err) {
            library.logger.error('Recovery failed');
        } else {
            library.logger.info('Recovery complete, new last block', newLastBlock.id);
        }
        return setImmediate(cb, err);
    });
};

/**
 * Handle modules initialization:
 * - accounts
 * - blocks
 * - rounds
 * - transactions
 * @param {modules} scope Exposed modules
 */
Chain.prototype.onBind = function (scope) {
    library.logger.trace('Blocks->Chain: Shared modules bind.');
    modules = {
        accounts: scope.accounts,
        blocks: scope.blocks,
        rounds: scope.rounds,
        transactions: scope.transactions,
    };

    // Set module as loaded
    __private.loaded = true;
};

module.exports = Chain;

/** ************************************* END OF FILE ************************************ */
