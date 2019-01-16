const _ = require('lodash');
const async = require('async');
const bignum = require('../helpers/bignum.js');
const checkIpInList = require('../helpers/checkIpInList.js');
const constants = require('../helpers/constants.js');
const jobsQueue = require('../helpers/jobsQueue.js');
const crypto = require('crypto');
const Delegate = require('../logic/delegate.js');
const Rounds = require('./rounds.js');
const OrderBy = require('../helpers/orderBy.js');
const sandboxHelper = require('../helpers/sandbox.js');
const schema = require('../schema/delegates.js');
const slots = require('../helpers/slots.js');
const sql = require('../sql/delegates.js');
const roundSql = require('../sql/rounds.js');
const accountSql = require('../sql/accounts.js');
const transactionTypes = require('../helpers/transactionTypes.js');

// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};

__private.assetTypes = {};
__private.loaded = false;
__private.readyForForging = false;
__private.keypairs = {};
__private.tmpKeypairs = {};

/**
 * Initializes library with scope content and generates a Delegate instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:delegates
 * @class
 * @classdesc Main delegates methods.
 * @param {scope} scope - App instance.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function Delegates(cb, scope) {
    library = {
        logger: scope.logger,
        sequence: scope.sequence,
        ed: scope.ed,
        db: scope.db,
        network: scope.network,
        schema: scope.schema,
        balancesSequence: scope.balancesSequence,
        logic: {
            transaction: scope.logic.transaction,
        },
        config: {
            forging: {
                secret: scope.config.forging.secret,
                access: {
                    whiteList: scope.config.forging.access.whiteList,
                },
                stopForging: scope.config.forging.stopForging,
            },
        },
    };
    self = this;

    __private.assetTypes[transactionTypes.DELEGATE] = library.logic.transaction.attachAssetType(
        transactionTypes.DELEGATE,
        new Delegate(
            scope.schema,
            scope.db
        )
    );

    setImmediate(cb, null, self);
}

// Private methods
/**
 * Gets delegate public keys sorted by vote descending.
 * @private
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback}
 */
__private.getKeysSortByVote = function (cb) {
    library.db.many(accountSql.getActiveDelegates, { limit: constants.activeDelegates }).then(rows => setImmediate(cb, null, rows.map(el => el.publicKey))).catch(err => setImmediate(cb, err));
};

/**
 * Gets slot time and keypair.
 * @private
 * @param {number} slot
 * @param {number} height
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | cb | object {time, keypair}.
 */
__private.getBlockSlotData = function (slot, height, cb) {
    self.generateDelegateList(height, null, (err, activeDelegates) => {
        if (err) {
            return setImmediate(cb, err);
        }

        let currentSlot = slot;
        const lastSlot = slots.getLastSlot(currentSlot);

        for (; currentSlot < lastSlot; currentSlot += 1) {
            const delegatePubKey = activeDelegates[currentSlot % Rounds.prototype.getSlotDelegatesCount(height)];

            if (delegatePubKey && __private.keypairs[delegatePubKey]) {
                return setImmediate(
                    cb, null, { time: slots.getSlotTime(currentSlot), keypair: __private.keypairs[delegatePubKey] }
                );
            }
        }

        return setImmediate(cb, null, null);
    });
};

/**
 * Gets peers, checks consensus and generates new block, once delegates
 * are enabled, client is ready to forge and is the correct slot.
 * @private
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback}
 */
__private.forge = function (cb) {
    if (!Object.keys(__private.keypairs).length) {
        library.logger.debug('No delegates enabled');
        return __private.loadDelegates(cb);
    }

    // When client is not loaded, is syncing or round is ticking
    // Do not try to forge new blocks as client is not ready
    if (!__private.loaded || modules.loader.syncing() || !modules.rounds.loaded() || modules.rounds.ticking() || !__private.readyForForging) {
        library.logger.debug('Client not ready to forge');
        return setImmediate(cb);
    }

    const currentSlot = slots.getSlotNumber();
    const lastBlock = modules.blocks.lastBlock.get();

    if (currentSlot === slots.getSlotNumber(lastBlock.timestamp)) {
        library.logger.debug('Waiting for next delegate slot');
        return setImmediate(cb);
    }

    __private.getBlockSlotData(currentSlot, lastBlock.height + 1, (err, currentBlockData) => {
        if (err || currentBlockData === null) {
            library.logger.warn('Skipping delegate slot', err);
            return setImmediate(cb);
        }

        if (slots.getSlotNumber(currentBlockData.time) !== slots.getSlotNumber()) {
            library.logger.debug('Delegate slot', slots.getSlotNumber());
            return setImmediate(cb);
        }

        library.sequence.add((cb) => {
            async.series({
                getPeers(seriesCb) {
                    return modules.transport.getPeers({ limit: constants.maxPeers }, seriesCb);
                },
                checkBroadhash(seriesCb) {
                    if (modules.transport.poorConsensus()) {
                        return setImmediate(seriesCb, ['Inadequate broadhash consensus', modules.transport.consensus(), '%'].join(' '));
                    }
                    return setImmediate(seriesCb);
                }
            }, (err) => {
                if (err) {
                    library.logger.warn(err);
                    return setImmediate(cb, err);
                }
                return modules.blocks.process.generateBlock(currentBlockData.keypair, currentBlockData.time, cb);
            });
        }, (err) => {
            if (err) {
                library.logger.error('Failed to generate block within delegate slot', err);
            } else {
                const forgedBlock = modules.blocks.lastBlock.get();
                modules.blocks.lastReceipt.update();

                library.logger.info([
                    'Forged new block id:', forgedBlock.id,
                    'height:', forgedBlock.height,
                    'round:', modules.rounds.calc(forgedBlock.height),
                    'slot:', slots.getSlotNumber(currentBlockData.time),
                    `reward:${forgedBlock.reward}`
                ].join(' '));
            }

            return setImmediate(cb);
        });
    });
};

/**
 * Checks each vote integrity and controls total votes don't exceed active delegates.
 * Calls modules.accounts.getAccount() to validate delegate account and votes accounts.
 * @private
 * @implements module:accounts#Account#getAccount
 * @param {publicKey} publicKey
 * @param {Array} votes
 * @param {string} state - 'confirmed' to delegates, otherwise u_delegates.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} cb | error messages
 */
__private.checkDelegates = function (publicKey, votes, state, cb) {
    if (!Array.isArray(votes)) {
        return setImmediate(cb, 'Votes must be an array');
    }

    modules.accounts.getAccount({ publicKey }, (err, account) => {
        if (err) {
            return setImmediate(cb, err);
        }

        if (!account) {
            return setImmediate(cb, 'Account not found');
        }

        const delegates = (state === 'confirmed') ? account.delegates : account.u_delegates;
        const existing_votes = Array.isArray(delegates) ? delegates.length : 0;
        let additions = 0,
            removals = 0;

        async.eachSeries(votes, (action, cb) => {
            const math = action[0];

            if (math === '+') {
                additions += 1;
            } else if (math === '-') {
                removals += 1;
            } else {
                return setImmediate(cb, 'Invalid math operator');
            }

            const publicKey = action.slice(1);

            try {
                Buffer.from(publicKey, 'hex');
            } catch (e) {
                library.logger.error(e.stack);
                return setImmediate(cb, 'Invalid public key');
            }

            if (math === '+' && (delegates != null && delegates.indexOf(publicKey) !== -1)) {
                return setImmediate(cb, 'Failed to add vote, account has already voted for this delegate');
            }


            // FIXME
            // https://trello.com/c/wh9i1ire/135-failed-to-remove-vote
            if (math === '-' && (delegates === null || delegates.indexOf(publicKey) === -1)) {
                return setImmediate(cb, 'Failed to remove vote, account has not voted for this delegate');
            }

            modules.accounts.getAccount({ publicKey, isDelegate: 1 }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                // FIXME right delegate include
                // https://trello.com/c/CN7Tij6M/133-delegate-not-found
                if (!account) {
                    return setImmediate(cb, 'Delegate not found');
                }

                return setImmediate(cb);
            });
        }, (err) => {
            if (err) {
                return setImmediate(cb, err);
            }

            const total_votes = (existing_votes + additions) - removals;

            if (total_votes > constants.maxVotes) {
                const exceeded = total_votes - constants.maxVotes;

                return setImmediate(cb, `Maximum number of votes possible ${constants.maxVotes}, exceeded by ${exceeded}`);
            }
            return setImmediate(cb);
        });
    });
};

/**
 * Loads delegates from config and stores in private `keypairs`.
 * @private
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback}
 */
__private.loadDelegates = function (cb) {
    let secret;

    if (library.config.forging.secret && typeof library.config.forging.secret === 'string') {
        secret = library.config.forging.secret;
    }

    if (!secret) {
        return setImmediate(cb);
    }
    library.logger.info(['Loading delegate from config'].join(' '));

    const keypair = library.ed.makeKeypair(crypto.createHash('sha256').update(secret, 'utf8').digest());
    const publicKey = keypair.publicKey.toString('hex');

    modules.accounts.getAccount({
        publicKey: publicKey
    }, (err, account) => {
        if (err) {
            return setImmediate(cb, err);
        }

        if (!account) {
            return setImmediate(cb, ['Account with public key:', publicKey, 'not found'].join(' '));
        }

        // Delegate can't forging blocks course env.STROP_FORGING flag is true
        if (library.config.forging.stopForging) {
            account.isDelegate = false;
            library.logger.info(['Forging stopped for account:', account.address].join(' '));
        }

        if (account.isDelegate) {
            __private.keypairs[publicKey] = keypair;
            library.logger.info(['Forging enabled on account:', account.address].join(' '));
        } else {
            library.logger.warn(['Account with public key:', publicKey, 'is not a delegate'].join(' '));
        }

        return setImmediate(cb);
    });
};

// Public methods
/**
 * Gets delegate list by vote and changes order.
 * @param {number} height
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} err | truncated delegate list.
 * @todo explain seed.
 */
Delegates.prototype.generateDelegateList = function (height, source, cb) {
    const round = slots.calcRound(height);
    source = source || __private.getKeysSortByVote;
    return source((err, truncDelegateList) => {
        if (err) {
            return setImmediate(cb, err);
        }
        const seedSource = round.toString();
        let currentSeed = crypto
            .createHash('sha256')
            .update(seedSource, 'utf8')
            .digest();


        for (let i = 0, delCount = truncDelegateList.length; i < delCount; i++) {
            for (let x = 0; x < 4 && i < delCount; i++, x++) {
                const newIndex = currentSeed[x] % delCount;
                const b = truncDelegateList[newIndex];
                truncDelegateList[newIndex] = truncDelegateList[i];
                truncDelegateList[i] = b;
            }
            currentSeed = crypto
                .createHash('sha256')
                .update(currentSeed)
                .digest();
        }

        return setImmediate(cb, null, truncDelegateList);
    });
};

/**
 * Gets delegates and for each one calculates rate, rank, approval, productivity.
 * Orders delegates as per criteria.
 * @param {Object} query
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error| object with delegates ordered, offset, count, limit.
 * @todo OrderBy does not affects data? What is the impact?.
 */
Delegates.prototype.getDelegates = function (query, cb) {
    if (!query) {
        throw 'Missing query argument';
    }
    modules.accounts.getAccounts({
        isDelegate: 1,
        sort: { voteCount: -1, vote: -1, publicKey: 1 }
    }, ['username', 'address', 'publicKey', 'vote', 'missedblocks', 'producedblocks', 'url'], (err, delegates) => {
        if (err) {
            return setImmediate(cb, err);
        }

        let limit = query.limit || Rounds.prototype.getSlotDelegatesCount();
        const offset = query.offset || 0;

        limit = limit > Rounds.prototype.getSlotDelegatesCount() ? Rounds.prototype.getSlotDelegatesCount() : limit;

        const count = delegates.length;
        const realLimit = Math.min(offset + limit, count);

        for (let i = 0; i < delegates.length; i++) {
            // TODO: 'rate' property is deprecated and need to be removed after transitional period
            delegates[i].rate = i + 1;
            delegates[i].rank = i + 1;
            // TODO change approval to right logic
            // https://trello.com/c/epSWVfXM/160-change-approval-to-right-logic

            delegates[i].approval = 100;
            delegates[i].approval = Math.round(delegates[i].approval * 1e2) / 1e2;

            let percent = 100 -
                (delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100));
            percent = Math.abs(percent) || 0;

            const outsider = i + 1 > Rounds.prototype.getSlotDelegatesCount();
            delegates[i].productivity = (!outsider) ? Math.round(percent * 1e2) / 1e2 : 0;
        }

        const orderBy = OrderBy(query.orderBy, { quoteField: false });

        if (orderBy.error) {
            return setImmediate(cb, orderBy.error);
        }

        return setImmediate(cb, null, {
            delegates,
            sortField: orderBy.sortField,
            sortMethod: orderBy.sortMethod,
            count,
            offset,
            limit: realLimit
        });
    });
};

/**
 * @param {publicKey} publicKey
 * @param {Array} votes
 * @param {function} cb
 * @return {function} Calls checkDelegates() with 'confirmed' state.
 */
Delegates.prototype.checkConfirmedDelegates = function (publicKey, votes, cb) {
    return __private.checkDelegates(publicKey, votes, 'confirmed', cb);
};

/**
 * @param {publicKey} publicKey
 * @param {Array} votes
 * @param {function} cb
 * @return {function} Calls checkDelegates() with 'unconfirmed' state.
 */
Delegates.prototype.checkUnconfirmedDelegates = function (publicKey, votes, cb) {
    return __private.checkDelegates(publicKey, votes, 'unconfirmed', cb);
};

/**
 * Inserts a fork into 'forks_stat' table and emits a 'delegates/fork' socket signal
 * with fork data: cause + block.
 * @param {block} block
 * @param {string} cause
 */
Delegates.prototype.fork = function (block, cause) {
    library.logger.info('Fork', {
        delegate: block.generatorPublicKey,
        block: { id: block.id, timestamp: block.timestamp, height: block.height, previousBlock: block.previousBlock },
        cause
    });

    const fork = {
        delegatePublicKey: block.generatorPublicKey,
        blockTimestamp: block.timestamp,
        blockId: block.id,
        blockHeight: block.height,
        previousBlock: block.previousBlock,
        cause
    };

    library.db.none(sql.insertFork, fork).then(() => {
        library.network.io.sockets.emit('delegates/fork', fork);
    });
};

/**
 * Generates delegate list and checks if block generator public key matches delegate id.
 *
 * @param {block} block
 * @param {function} cb - Callback function
 * @returns {setImmediateCallback} cb, err
 * @todo Add description for the params
 */
Delegates.prototype.validateBlockSlot = function (block, cb) {
    __private.validateBlockSlot(block, __private.getKeysSortByVote, cb);
};

/**
 * Generates delegate list and checks if block generator public Key
 * matches delegate id.
 * @param {block} block
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error message | cb
 */
__private.validateBlockSlot = function (block, source, cb) {
    self.generateDelegateList(block.height, source, (err, activeDelegates) => {
        if (err) {
            return setImmediate(cb, err);
        }

        if (block.height <= constants.MASTER_NODE_MIGRATED_BLOCK) {
            return setImmediate(cb);
        }

        const currentSlot = slots.getSlotNumber(block.timestamp);
        const delegatePubKey = activeDelegates[currentSlot % Rounds.prototype.getSlotDelegatesCount(block.height)];

        if (delegatePubKey && block.generatorPublicKey === delegatePubKey) {
            return setImmediate(cb);
        }

        // TODO: Restore slote verify
        // https://trello.com/c/2jF7cnad/115-restore-transactions-verifing
        return setImmediate(cb);

        library.logger.error(`Expected generator: ${delegatePubKey} Received generator: ${block.generatorPublicKey}`);
        return setImmediate(cb, `Failed to verify slot: ${currentSlot}`);
    });
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Delegates.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Calls Delegate.bind() with scope.
 * @implements module:delegates#Delegate~bind
 * @param {modules} scope - Loaded modules.
 */
Delegates.prototype.onBind = function (scope) {
    modules = {
        loader: scope.loader,
        rounds: scope.rounds,
        accounts: scope.accounts,
        blocks: scope.blocks,
        transport: scope.transport,
        transactions: scope.transactions,
        delegates: scope.delegates,
    };

    __private.assetTypes[transactionTypes.DELEGATE].bind(
        scope.accounts
    );
};

/**
 * Loads delegates.
 * @implements module:transactions#Transactions~fillPool
 */
Delegates.prototype.onBlockchainReadyForForging = function () {
    __private.readyForForging = true;
};

/**
 * Loads delegates.
 * @implements module:transactions#Transactions~fillPool
 */
Delegates.prototype.onBlockchainReady = function () {
    __private.loaded = true;

    __private.loadDelegates((err) => {
        function nextForge(cb) {
            if (err) {
                library.logger.error('Failed to load delegates', err);
            }

            async.series([
                __private.forge,
                modules.transactions.fillPool
            ], () => setImmediate(cb));
        }

        if (!constants.forging.stopForging) {
            jobsQueue.register('delegatesNextForge', nextForge, 1000);
        }
    });
};

/**
 * Sets loaded to false.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Returns cb.
 */
Delegates.prototype.cleanup = function (cb) {
    __private.loaded = false;
    return setImmediate(cb);
};

/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
Delegates.prototype.isLoaded = function () {
    return !!modules;
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Delegates.prototype.internal = {
    forgingEnable(req, cb) {
        library.schema.validate(req.body, schema.enableForging, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const keypair = library.ed.makeKeypair(crypto.createHash('sha256').update(req.body.secret, 'utf8').digest());
			const publicKey = keypair.publicKey.toString('hex');

            if (req.body.publicKey) {
                if (publicKey !== req.body.publicKey) {
                    return setImmediate(cb, 'Invalid passphrase');
                }
            }

            if (__private.keypairs[publicKey]) {
                return setImmediate(cb, 'Forging is already enabled');
            }

            modules.accounts.getAccount({ publicKey: publicKey }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                if (account && account.isDelegate) {
                    __private.keypairs[publicKey] = keypair;
                    library.logger.info(`Forging enabled on account: ${account.address}`);
                    return setImmediate(cb, null, { address: account.address });
                }
                return setImmediate(cb, 'Delegate not found');
            });
        });
    },

    forgingDisable(req, cb) {
        library.schema.validate(req.body, schema.disableForging, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const publicKey = library.ed.makePublicKeyHex(crypto.createHash('sha256').update(req.body.secret, 'utf8').digest());

            if (req.body.publicKey) {
                if (publicKey !== req.body.publicKey) {
                    return setImmediate(cb, 'Invalid passphrase');
                }
            }

            if (!__private.keypairs[publicKey]) {
                return setImmediate(cb, 'Delegate not found');
            }

            modules.accounts.getAccount({ publicKey: publicKey }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                if (account && account.isDelegate) {
                    delete __private.keypairs[publicKey];
                    library.logger.info(`Forging disabled on account: ${account.address}`);
                    return setImmediate(cb, null, { address: account.address });
                }
                return setImmediate(cb, 'Delegate not found');
            });
        });
    },

    forgingStatus(req, cb) {
        if (!checkIpInList(library.config.forging.access.whiteList, req.ip)) {
            return setImmediate(cb, 'Access denied');
        }

        library.schema.validate(req.body, schema.forgingStatus, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            if (req.body.publicKey) {
                return setImmediate(cb, null, { enabled: !!__private.keypairs[req.body.publicKey] });
            }
            const delegates_cnt = _.keys(__private.keypairs).length;
            return setImmediate(cb, null, { enabled: delegates_cnt > 0, delegates: _.keys(__private.keypairs) });
        });
    },

    forgingEnableAll(req, cb) {
        if (Object.keys(__private.tmpKeypairs).length === 0) {
            return setImmediate(cb, 'No delegate keypairs defined');
        }

        __private.keypairs = __private.tmpKeypairs;
        __private.tmpKeypairs = {};
        return setImmediate(cb);
    },

    forgingDisableAll(req, cb) {
        if (Object.keys(__private.tmpKeypairs).length !== 0) {
            return setImmediate(cb, 'Delegate keypairs are defined');
        }

        __private.tmpKeypairs = __private.keypairs;
        __private.keypairs = {};
        return setImmediate(cb);
    },

    getLatestVoters(req, cb) {
        library.db.query(sql.getLatestVoters, {
            limit: req.body.limit
        })
            .then(voters => setImmediate(cb, null, { voters }))
            .catch(err => setImmediate(cb, err));
    },

    getLatestDelegates(req, cb) {
        library.db.query(sql.getLatestDelegates, {
            limit: req.body.limit
        })
            .then(delegates => setImmediate(cb, null, { delegates }))
            .catch(err => setImmediate(cb, err));
    }
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Delegates.prototype.shared = {
    // TODO rewrite that ***
    getDelegate(req, cb) {
        library.schema.validate(req.body, schema.getDelegate, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            modules.delegates.getDelegates(req.body, (err, data) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                const delegate = _.find(data.delegates, (delegate) => {
                    if (req.body.publicKey) {
                        return delegate.publicKey === req.body.publicKey;
                    } else if (req.body.username) {
                        return delegate.username === req.body.username;
                    }

                    return false;
                });

                if (delegate) {
                    return setImmediate(cb, null, { delegate });
                }
                return setImmediate(cb, 'Delegate not found');
            });
        });
    },

    getNextForgers(req, cb) {
        const currentBlock = modules.blocks.lastBlock.get();
        const limit = req.body.limit || 10;

        modules.delegates.generateDelegateList(currentBlock.height, null, (err, activeDelegates) => {
            if (err) {
                return setImmediate(cb, err);
            }

            const currentBlockSlot = slots.getSlotNumber(currentBlock.timestamp);
            const currentSlot = slots.getSlotNumber();
            const nextForgers = [];

            for (let i = 1; i <= Rounds.prototype.getSlotDelegatesCount(currentBlock.height) && i <= limit; i++) {
                if (activeDelegates[(currentSlot + i) % Rounds.prototype.getSlotDelegatesCount(currentBlock.height + i)]) {
                    nextForgers.push(
                        activeDelegates[(currentSlot + i) % Rounds.prototype.getSlotDelegatesCount(currentBlock.height + i)]
                    );
                }
            }

            return setImmediate(cb, null, {
                currentBlock: currentBlock.height,
                currentBlockSlot,
                currentSlot,
                delegates: nextForgers
            });
        });
    },

    search(req, cb) {
        library.schema.validate(req.body, schema.search, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const orderBy = OrderBy(
                req.body.orderBy, {
                    sortFields: sql.sortFields,
                    sortField: 'username'
                }
            );

            if (orderBy.error) {
                return setImmediate(cb, orderBy.error);
            }

            library.db.query(sql.search({
                q: req.body.q,
                limit: req.body.limit || 101,
                sortField: orderBy.sortField,
                sortMethod: orderBy.sortMethod
            })).then(rows => setImmediate(cb, null, { delegates: rows })).catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, 'Database search failed');
            });
        });
    },

    count(req, cb) {
        library.db.one(sql.count).then(row => setImmediate(cb, null, { count: row.count })).catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Failed to count delegates');
        });
    },

    getVoters(req, cb) {
        library.schema.validate(req.body, schema.getVoters, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            library.db.one(sql.getVoters, { publicKey: req.body.publicKey }).then((row) => {
                const addresses = (row.accountIds) ? row.accountIds : [];

                modules.accounts.getAccounts({
                    address: { $in: addresses },
                    sort: 'balance'
                }, ['address', 'balance', 'username', 'publicKey'], (err, rows) => {
                    if (err) {
                        return setImmediate(cb, err);
                    }
                    return setImmediate(cb, null, { accounts: rows });
                });
            }).catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, `Failed to get voters for delegate: ${req.body.publicKey}`);
            });
        });
    },

    getDelegates(req, cb) {
        library.schema.validate(req.body, schema.getDelegates, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            modules.delegates.getDelegates(req.body, (err, data) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                function compareNumber(a, b) {
                    const sorta = parseFloat(a[data.sortField]);
                    const sortb = parseFloat(b[data.sortField]);
                    if (data.sortMethod === 'ASC') {
                        return sorta - sortb;
                    }
                    return sortb - sorta;
                }

                function compareString(a, b) {
                    const sorta = a[data.sortField];
                    const sortb = b[data.sortField];
                    if (data.sortMethod === 'ASC') {
                        return sorta.localeCompare(sortb);
                    }
                    return sortb.localeCompare(sorta);
                }

                if (data.sortField) {
                    // TODO: 'rate' property is deprecated and need to be removed after transitional period
                    if (['approval', 'productivity', 'rate', 'rank', 'vote'].indexOf(data.sortField) > -1) {
                        data.delegates = data.delegates.sort(compareNumber);
                    } else if (['username', 'address', 'publicKey'].indexOf(data.sortField) > -1) {
                        data.delegates = data.delegates.sort(compareString);
                    } else {
                        return setImmediate(cb, 'Invalid sort field');
                    }
                }

                const delegates = data.delegates.slice(data.offset, data.limit);

                return setImmediate(cb, null, { delegates, totalCount: data.count });
            });
        });
    },

    getFee(req, cb) {
        return setImmediate(cb, null, { fee: constants.fees.delegate });
    },

    getForgedByAccount(req, cb) {
        library.schema.validate(req.body, schema.getForgedByAccount, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            if (req.body.start !== undefined || req.body.end !== undefined) {
                modules.blocks.utils.aggregateBlocksReward({
                    generatorPublicKey: req.body.generatorPublicKey,
                    start: req.body.start,
                    end: req.body.end
                }, (err, reward) => {
                    if (err) {
                        return setImmediate(cb, err);
                    }

                    const forged = new bignum(reward.fees).plus(new bignum(reward.rewards)).toString();
                    return setImmediate(cb, null, {
                        fees: reward.fees,
                        rewards: reward.rewards,
                        forged,
                        count: reward.count
                    });
                });
            } else {
                modules.accounts.getAccount({ publicKey: req.body.generatorPublicKey }, ['fees', 'rewards'], (err, account) => {
                    if (err || !account) {
                        return setImmediate(cb, err || 'Account not found');
                    }

                    const forged = new bignum(account.fees).plus(new bignum(account.rewards)).toString();
                    return setImmediate(cb, null, { fees: account.fees, rewards: account.rewards, forged });
                });
            }
        });
    },

    addDelegate(req, cb) {
        library.schema.validate(req.body, schema.addDelegate, (err) => {
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

            library.balancesSequence.add((cb) => {
                if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== publicKey) {
                    modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }

                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Multisignature account not found');
                        }

                        if (!account.multisignatures || !account.multisignatures) {
                            return setImmediate(cb, 'Account does not have multisignatures enabled');
                        }

                        if (account.multisignatures.indexOf(publicKey) < 0) {
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
                                return setImmediate(cb, 'Missing requester second passphrase');
                            }

                            if (requester.publicKey === account.publicKey) {
                                return setImmediate(cb, 'Invalid requester public key');
                            }

                            let secondKeypair = null;

                            if (requester.secondSignature) {
                                const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                secondKeypair = library.ed.makeKeypair(secondHash);
                            }

                            let transaction;

                            library.logic.transaction.create({
                                type: transactionTypes.DELEGATE,
                                username: req.body.username,
                                URL: req.body.URL,
                                sender: account,
                                keypair,
                                secondKeypair,
                                requester: keypair
                            }).then((transactionDelegate) => {
                                transaction = transactionDelegate;
                                modules.transactions.receiveTransactions([transaction], true, cb);
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
                            return setImmediate(cb, 'Invalid second passphrase');
                        }

                        let secondKeypair = null;

                        if (account.secondSignature) {
                            const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                            secondKeypair = library.ed.makeKeypair(secondHash);
                        }

                        let transaction;

                        library.logic.transaction.create({
                            type: transactionTypes.DELEGATE,
                            username: req.body.username,
                            URL: req.body.URL,
                            sender: account,
                            keypair,
                            secondKeypair
                        }).then((transactionDelegate) => {
                            transaction = transactionDelegate;
                            modules.transactions.receiveTransactions([transaction], true, cb);
                        }).catch(e => setImmediate(cb, e.toString()));
                    });
                }
            }, (err, transaction) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                return setImmediate(cb, null, { transaction: transaction[0] });
            });
        });
    }
};

/**
 * Generates delegate list and checks if block generator public key matches delegate id - against previous round.
 *
 * @param {block} block
 * @param {function} cb - Callback function
 * @returns {setImmediateCallback} cb, err
 * @todo Add description for the params
 */
Delegates.prototype.validateBlockSlotAgainstPreviousRound = function (block,
                                                                      cb) {
    __private.validateBlockSlot(
        block,
        __private.getDelegatesFromPreviousRound,
        cb
    );
};

/**
 * Gets delegate public keys from previous round, sorted by vote descending.
 *
 * @private
 * @param {function} cb - Callback function
 * @returns {setImmediateCallback} cb
 * @todo Add description for the return value
 */
__private.getDelegatesFromPreviousRound = function (cb) {
    library.db.query(roundSql.getDelegatesSnapshot, { limit: constants.activeDelegates })
        .then((rows) => {
            const delegatesPublicKeys = [];
            rows.forEach((row) => {
                delegatesPublicKeys.push(row.publicKey);
            });
            return setImmediate(cb, null, delegatesPublicKeys);
        })
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'getDelegatesSnapshot database query failed');
        });
};

// Export
module.exports = Delegates;

/** ************************************* END OF FILE ************************************ */
