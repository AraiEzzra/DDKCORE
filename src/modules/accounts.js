const Cache = require('./cache.js');
const bignum = require('../helpers/bignum.js');
const constants = require('../helpers/constants.js');
const crypto = require('crypto');
const schema = require('../schema/accounts.js');
const sandboxHelper = require('../helpers/sandbox.js');
const transactionTypes = require('../helpers/transactionTypes.js');
const Vote = require('../logic/vote.js');
const Referral = require('../logic/referral.js');
const sql = require('../sql/accounts.js');
const cache = require('./cache.js');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const slots = require('../helpers/slots.js');
const async = require('async');

let nextBonus = 0;
const Mnemonic = require('bitcore-mnemonic');
const mailServices = require('../helpers/postmark');
// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};
const frogings_sql = require('../sql/frogings');

const DDK_DATA_EXPIRE = 300;
const TOTAL_ACCOUNT = 'TOTAL_ACCOUNT';
const TOTAL_ACCOUNT_EXPIRE = 300;

__private.assetTypes = {};

/**
 * Initializes library with scope content and generates a Vote instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:accounts
 * @class
 * @classdesc Main accounts methods.
 * @implements module:accounts.Account#Vote
 * @param {scope} scope - App instance.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
function Accounts(cb, scope) {
    library = {
        ed: scope.ed,
        db: scope.db,
        cache: scope.cache,
        logger: scope.logger,
        schema: scope.schema,
        balancesSequence: scope.balancesSequence,
        logic: {
            account: scope.logic.account,
            transaction: scope.logic.transaction,
            contract: scope.logic.contract,
            vote: scope.logic.vote
        },
        config: scope.config
    };
    self = this;

    __private.assetTypes[transactionTypes.VOTE] = library.logic.transaction.attachAssetType(
        transactionTypes.VOTE,
        new Vote(
            scope.logger,
            scope.schema,
            scope.db,
            scope.logic.frozen
        )
    );

    __private.assetTypes[transactionTypes.REFERRAL] = library.logic.transaction.attachAssetType(
        transactionTypes.REFERRAL,
        new Referral(
            scope.logger,
            scope.schema,
            scope.db,
            scope.logic.account
        )
    );

    setImmediate(cb, null, self);
}

/**
 * Gets account from publicKey obtained from secret parameter.
 * If not existes, generates new account data with public address
 * obtained from secret parameter.
 * @private
 * @param {function} secret
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} As per logic new|current account data object.
 */
__private.openAccount = (body, cb) => {
    const hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
    const keypair = library.ed.makeKeypair(hash);
    const publicKey = keypair.publicKey.toString('hex');

    self.getAccount({ publicKey }, (err, account) => {
        if (err) {
            return setImmediate(cb, err);
        }

        if (account) {
            if (account.publicKey == null) {
                account.publicKey = publicKey;
            }
            return setImmediate(cb, null, account);
        }
        const newAccount = {
            address: self.generateAddressByPublicKey(publicKey),
            u_balance: '0',
            balance: '0',
            publicKey,
            u_secondSignature: 0,
            secondSignature: 0,
            secondPublicKey: null,
            multisignatures: null,
            u_multisignatures: null
        };

        self.verifyReferral(body.referal, newAccount.address).then(() => {
            library.logic.transaction.create({
                type: transactionTypes.REFERRAL,
                sender: newAccount,
                keypair,
                referral: body.referal,
            }).then((referralTransaction) => {
                referralTransaction.status = 0;
                modules.transactions.putInQueue(referralTransaction);
                return setImmediate(cb, null, [referralTransaction]);
            }).catch((receiveTransactionsError) => {
                throw receiveTransactionsError;
            });
        }).catch((apiError) => {
            library.logger.error(`Referral API Error: ${apiError}`);
            return setImmediate(cb, apiError.toString());
        });
    });
};

__private.getTotalAccountFromCache = async function () {
    return new Promise(async (resolve, reject) => {
        try {
            const resultFromCache = await Cache.prototype.getJsonForKeyAsync(TOTAL_ACCOUNT);

            if (resultFromCache !== null) {
                resolve(resultFromCache);
            }

            const row = await library.db.one(sql.getTotalAccount);

            await Cache.prototype.setJsonForKeyAsync(
                TOTAL_ACCOUNT, row, TOTAL_ACCOUNT_EXPIRE
            );
            resolve(row);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Generates address based on public key.
 * @param {publicKey} publicKey - PublicKey.
 * @returns {address} Address generated.
 * @throws {string} If address is invalid throws `Invalid public key`.
 */
Accounts.prototype.generateAddressByPublicKey = function (publicKey) {
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    const temp = Buffer.alloc(8);

    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    const address = `DDK${bignum.fromBuffer(temp).toString()}`;

    if (!address) {
        throw `Invalid public key: ${publicKey}`;
    }

    return address;
};

/**
 * Gets account information, calls logic.account.get().
 * @implements module:accounts#Account~get
 * @param {Object} filter - Containts publicKey.
 * @param {function} fields - Fields to get.
 * @param {function} cb - Callback function.
 */
Accounts.prototype.getAccount = function (filter, fields, cb) {
    if (filter.publicKey) {
        filter.address = self.generateAddressByPublicKey(filter.publicKey);
        delete filter.publicKey;
    }

    library.logic.account.get(filter, fields, cb);
};

Accounts.prototype.verifyReferral = async function (referralAddress, accountAddress) {
    if (!referralAddress) {
        return Promise.resolve();
    }

    if (referralAddress === accountAddress) {
        return Promise.reject('Introducer and sponsor cannot be same');
    }

    let referral;
    try {
        referral = await library.db.oneOrNone(sql.getUserByAddress, { address: referralAddress });
    } catch (error) {
        return Promise.reject(`Cannot get account from db: ${error.message}`);
    }

    if (!referral) {
        return Promise.reject('Referral does not found');
    }

    return Promise.resolve();
};

/**
 * Gets accounts information, calls logic.account.getAll().
 * @implements module:accounts#Account~getAll
 * @param {Object} filter
 * @param {Object} fields
 * @param {function} cb - Callback function.
 */
Accounts.prototype.getAccounts = function (filter, fields, cb) {
    library.logic.account.getAll(filter, fields, cb);
};

/**
 * Validates input address and calls logic.account.set() and logic.account.get().
 * @implements module:accounts#Account~set
 * @implements module:accounts#Account~get
 * @param {Object} data - Contains address or public key to generate address.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} Errors.
 * @returns {function()} Call to logic.account.get().
 */
Accounts.prototype.setAccountAndGet = function (data, cb) {
    let address = data.address || null;
    let err;

    if (address === null) {
        if (data.publicKey) {
            address = self.generateAddressByPublicKey(data.publicKey);
        } else {
            err = 'Missing address or public key';
        }
    }

    if (!address) {
        err = 'Invalid public key';
    }

    if (err) {
        if (typeof cb === 'function') {
            return setImmediate(cb, err);
        }
        throw err;
    }

    const REDIS_KEY_USER = 'userAccountInfo_' + address;

    cache.prototype.isExists(REDIS_KEY_USER, (err, isExist) => {
        if (!isExist) {
            cache.prototype.setJsonForKey(REDIS_KEY_USER, address);
        }

        library.logic.account.set(address, data, (err) => {
            if (err) {
                return setImmediate(cb, err);
            }
            return library.logic.account.get({ address: address }, cb);
        });
    });
};

/**
 * Validates input address and calls logic.account.merge().
 * @implements module:accounts#Account~merge
 * @param {Object} data - Contains address and public key.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} for errors wit address and public key.
 * @returns {function} calls to logic.account.merge().
 * @todo improve publicKey validation try/catch
 */
Accounts.prototype.mergeAccountAndGet = function (data, cb) {
    let address = data.address || null;
    let err;

    if (address === null) {
        if (data.publicKey) {
            address = self.generateAddressByPublicKey(data.publicKey);
        } else {
            err = 'Missing address or public key';
        }
    }

    if (!address) {
        err = 'Invalid public key';
    }

    if (err) {
        if (typeof cb === 'function') {
            return setImmediate(cb, err);
        }
        throw err;
    }
    return library.logic.account.merge(address, data, cb);
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {} args - List of arguments.
 * @param {function} cb - Callback function.
 * @todo verified function and arguments.
 */
Accounts.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Calls Vote.bind() with scope.
 * @implements module:accounts#Vote~bind
 * @param {modules} scope - Loaded modules.
 */
Accounts.prototype.onBind = function (scope) {
    modules = {
        delegates: scope.delegates,
        accounts: scope.accounts,
        transactions: scope.transactions,
        blocks: scope.blocks
    };

    __private.assetTypes[transactionTypes.VOTE].bind(
        scope.delegates,
        scope.rounds,
        scope.accounts
    );
};
/**
 * Checks if modules is loaded.
 * @return {boolean} true if modules is loaded
 */
Accounts.prototype.isLoaded = function () {
    return !!modules;
};

Accounts.prototype.addressExists = async function (referrer_address) {
    let result;
    try {
        result = await library.db.one(sql.validateReferSource, { referSource: referrer_address });
        return result.address > 0;
    } catch (e) {
        return false;
    }
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Accounts.prototype.shared = {
    open(req, cb) {
        library.schema.validate(req.body, schema.open, async (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            if (req.body.referal && !await self.addressExists(req.body.referal)) {
                return setImmediate(cb, 'Referral Address is Invalid');
            }

            __private.openAccount(req.body, (err, account) => {
                if (!err) {
                    const payload = {
                        secret: req.body.secret,
                        address: account.address
                    };
                    const token = jwt.sign(payload, library.config.jwt.secret, {
                        expiresIn: library.config.jwt.tokenLife,
                        mutatePayload: false
                    });

                    const REDIS_KEY_USER_INFO_HASH = `userAccountInfo_${  account.address}`;

                    const accountData = {
                        address: account.address,
                        username: account.username,
                        unconfirmedBalance: account.u_balance,
                        balance: account.balance,
                        publicKey: account.publicKey,
                        unconfirmedSignature: account.u_secondSignature,
                        secondSignature: account.secondSignature,
                        secondPublicKey: account.secondPublicKey,
                        multisignatures: account.multisignatures,
                        u_multisignatures: account.u_multisignatures,
                        totalFrozeAmount: account.totalFrozeAmount,
                        groupBonus: account.group_bonus
                    };

                    accountData.token = token;

                    if (req.body.email) {
                        const mailOptions = {
                            From: library.config.mailFrom,
                            To: req.body.email,
                            TemplateId: constants.TemplateId.welcomeMail,
                            TemplateModel: {
                                ddk: {
                                    username: req.body.email,
                                    ddk_address: accountData.address,
                                    public_key: accountData.publicKey
                                }
                            }
                        };
                        (async function () {
                            await mailServices.sendEmailWithTemplate(mailOptions, (err) => {
                                if (err) {
                                    library.logger.error(err.stack);
                                    return setImmediate(cb, err.toString());
                                }
                            });
                        }());
                    }

                    // library.cache.client.set('jwtToken_' + account.address, token, 'ex', 100);
                    /** ************************************************************* */

                    cache.prototype.isExists(REDIS_KEY_USER_INFO_HASH, (err, isExist) => {
                        if (!isExist) {
                            cache.prototype.setJsonForKey(REDIS_KEY_USER_INFO_HASH, accountData.address);
                            return setImmediate(cb, null, { account: accountData });
                        } else if (req.body.etps_user) {
                            library.db.none(sql.updateEtp, {
                                transfer_time: slots.getTime(),
                                address: accountData.address
                            }).then(function () {
                                return setImmediate(cb, null, {
                                    account: accountData
                                });
                            }).catch(function (err) {
                                library.logger.error(err.stack);
                                return setImmediate(cb, err);
                            });
                        } else {
                            return setImmediate(cb, null, {
                                account: accountData
                            });
                        }
                    });
                } else {
                    return setImmediate(cb, err);
                }
            });
        });
    },

    getBalance(req, cb) {
        library.schema.validate(req.body, schema.getBalance, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            self.getAccount({ address: req.body.address }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                const balance = account ? account.balance : '0';
                const unconfirmedBalance = account ? account.u_balance : '0';

                return setImmediate(cb, null, { balance: balance, unconfirmedBalance });
            });
        });
    },

    getPublickey(req, cb) {
        library.schema.validate(req.body, schema.getPublicKey, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            self.getAccount({ address: req.body.address }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                if (!account || !account.publicKey) {
                    return setImmediate(cb, 'Account not found');
                }

                return setImmediate(cb, null, { publicKey: account.publicKey });
            });
        });
    },

    generatePublicKey(req, cb) {
        library.schema.validate(req.body, schema.generatePublicKey, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const publicKey = library.ed.makePublicKeyHex(hash);

            return setImmediate(cb, err, {
                publicKey
            });
        });
    },

    getDelegates(req, cb) {
        library.schema.validate(req.body, schema.getDelegates, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            self.getAccount({ address: req.body.address }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                if (!account) {
                    return setImmediate(cb, 'Account not found');
                }

                if (account.delegates) {
                    modules.delegates.getDelegates(req.body, (err, res) => {
                        const delegates = res.delegates.filter((delegate) => {
                            return account.delegates.indexOf(delegate.publicKey) !== -1;
                        });

                        return setImmediate(cb, null, { delegates: delegates });
                    });
                } else {
                    return setImmediate(cb, null, { delegates: [] });
                }
            });
        });
    },

    getDelegatesFee(req, cb) {
        return setImmediate(cb, null, { fee: constants.fees.delegate });
    },

    addDelegates(req, cb) {
        library.schema.validate(req.body, schema.addDelegates, (err) => {
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

                            // TODO change that if
                            if (account.totalFrozeAmount === 0) {
                                return setImmediate(cb, 'No Stake available');
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

                            if (requester.totalFrozeAmount == 0) {
                                return setImmediate(cb, 'Please Stake before vote/unvote');
                            }

                            let secondKeypair = null;

                            if (requester.secondSignature) {
                                const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                secondKeypair = library.ed.makeKeypair(secondHash);
                            }

                            library.db.one(sql.countAvailableStakeOrdersForVote, {
                                senderId: account.address,
                                currentTime: slots.getTime()
                            }).then((queryResult) => {
                                if (queryResult && queryResult.hasOwnProperty('count')) {
                                    const count = parseInt(queryResult.count, 10);
                                    if (count <= 0) {
                                        throw 'No Stake available';
                                    }
                                    library.logic.transaction.create({
                                        type: transactionTypes.VOTE,
                                        votes: req.body.delegates,
                                        sender: account,
                                        keypair,
                                        secondKeypair,
                                        requester: keypair
                                    }).then((transactionVote) => {
                                        transactionVote.status = 0;
                                        modules.transactions.putInQueue(transactionVote);
                                        return setImmediate(cb, null, [transactionVote]);
                                    }).catch((e) => {
                                        throw e;
                                    });
                                }
                            }).catch((e) => setImmediate(cb, e.toString()));
                        });
                    });
                } else {
                    self.setAccountAndGet({ publicKey: publicKey }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }
                        // TODO change that if
                        if (account.totalFrozeAmount === 0) {
                            return setImmediate(cb, 'No Stake available');
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

                        if (account.totalFrozeAmount == 0) {
                            return setImmediate(cb, 'Please Stake before vote/unvote');
                        }

                        library.db.one(sql.countAvailableStakeOrdersForVote, {
                            senderId: account.address,
                            currentTime: slots.getTime()
                        }).then((queryResult) => {
                            if (queryResult && queryResult.hasOwnProperty('count')) {
                                const count = parseInt(queryResult.count, 10);
                                if (count <= 0) {
                                    throw 'No Stake available';
                                }
                                library.logic.transaction.create({
                                    type: transactionTypes.VOTE,
                                    votes: req.body.delegates,
                                    sender: account,
                                    keypair,
                                    secondKeypair
                                }).then((transactionVote) => {
                                    transactionVote.status = 0;
                                    modules.transactions.putInQueue(transactionVote);
                                    return setImmediate(cb, null, [transactionVote]);
                                }).catch((e) => {
                                    throw e;
                                });
                            }
                        }).catch((e) => setImmediate(cb, e.toString()));
                    });
                }
            }, (err, transaction) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                return setImmediate(cb, null, { transaction: transaction[0] });
            });
        });
    },

    getAccount(req, cb) {
        library.schema.validate(req.body, schema.getAccount, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            if (!req.body.address && !req.body.publicKey) {
                return setImmediate(cb, 'Missing required property: address or publicKey');
            }

            const address = req.body.publicKey ? self.generateAddressByPublicKey(req.body.publicKey) : req.body.address;
            if (req.body.address && req.body.publicKey && address !== req.body.address) {
                return setImmediate(cb, 'Account publicKey does not match address');
            }

            self.getAccount({ address: address }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                if (!account) {
                    return setImmediate(cb, 'Account not found');
                }

                return setImmediate(cb, null, {
                    account: {
                        address: account.address,
                        unconfirmedBalance: account.u_balance,
                        balance: account.balance,
                        publicKey: account.publicKey,
                        unconfirmedSignature: account.u_secondSignature,
                        secondSignature: account.secondSignature,
                        secondPublicKey: account.secondPublicKey,
                        multisignatures: account.multisignatures || [],
                        u_multisignatures: account.u_multisignatures || [],
                        totalFrozeAmount: account.totalFrozeAmount
                    }
                });
            });
        });
    },

    totalAccounts(req, cb) {
        __private.getTotalAccountFromCache()
            .then((data) => {
                return setImmediate(cb, null, data);
            })
            .catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, err.toString());
            });
    },

    getCirculatingSupply(req, cb) {
        library.db.one(sql.getCurrentUnmined, { address: library.config.forging.totalSupplyAccount })
            .then((currentUnmined) => {
                const circulatingSupply = library.config.ddkSupply.totalSupply - currentUnmined.balance;
                cache.prototype.getJsonForKey('minedContributorsBalance', (err, contributorsBalance) => {
                    const totalCirculatingSupply = parseInt(contributorsBalance) + circulatingSupply;

                    return setImmediate(cb, null, {
                        circulatingSupply: totalCirculatingSupply
                    });
                });
            })
            .catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, err.toString());
            });
    },

    totalSupply(req, cb) {
        library.db.one(sql.getCurrentUnmined, { address: library.config.forging.totalSupplyAccount })
            .then((currentUnmined) => {
                return setImmediate(cb, null, {
                    totalSupply: parseInt(currentUnmined.balance)
                });
            })
            .catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, err.toString());
            });
    },

    migrateData(req, cb) {
        function getStakeOrderFromETPS(next) {
            library.db.query(sql.getETPSStakeOrders, {
                account_id: req.body.data.id
            })
                .then((orders) => {
                    next(null, orders);
                }).catch((err) => {
                library.logger.error(err.stack);
                next(err, null);
            });
        }

        function insertstakeOrder(order, next) {
            const date = new Date((slots.getTime()) * 1000);
            const nextVoteMilestone = (date.setMinutes(date.getMinutes() + constants.froze.vTime)) / 1000;

            library.db.none(sql.InsertStakeOrder, {
                account_id: req.body.data.id,
                startTime: (slots.getTime(order.insert_time)),
                insertTime: slots.getTime(),
                senderId: req.body.address,
                freezedAmount: order.cost * 100000000,
                rewardCount: order.month_count,
                status: 1,
                nextVoteMilestone
            })
                .then(() => {
                    next(null, null);
                })
                .catch((err) => {
                    library.logger.error(err.stack);
                    next(err, null);
                });
        }

        function insertStakeOrdersInETP(next, orders) {
            async.eachSeries(orders, (order, eachSeriesCb) => {
                insertstakeOrder(order, (err) => {
                    if (err) {
                        next(err, null);
                    } else {
                        eachSeriesCb();
                    }
                });
            }, (err) => {
                next(err, null);
            });
        }

        function checkFrozeAmountsInStakeOrders(next) {
            library.db.one(sql.totalFrozeAmount, {
                account_id: (req.body.data.id).toString()
            })
                .then((totalFrozeAmount) => {
                    if (totalFrozeAmount) {
                        next(null, totalFrozeAmount);
                    } else {
                        next(null, 0);
                    }
                }).catch((err) => {
                library.logger.error(err.stack);
                next(err, null);
            });
        }

        function updateMemAccountTable(next, totalFrozeAmount) {
            library.db.none(sql.updateUserInfo, {
                address: req.body.address,
                balance: parseInt(totalFrozeAmount.sum),
                email: req.body.data.email,
                phone: req.body.data.phone,
                username: req.body.data.username,
                country: req.body.data.country,
                totalFrozeAmount: parseInt(totalFrozeAmount.sum),
                group_bonus: req.body.group_bonus
            })
                .then(() => {
                    next(null, null);
                })
                .catch((err) => {
                    library.logger.error(err.stack);
                    next(err, null);
                });
        }

        function updateETPSUserDetail(next) {
            const date = new Date((slots.getRealTime()));

            library.db.none(sql.updateETPSUserInfo, {
                userId: req.body.data.id,
                insertTime: date
            })
                .then(() => {
                    next(null, null);
                })
                .catch((err) => {
                    library.logger.error(err.stack);
                    next(err, null);
                });
        }

        async.auto({
            getStakeOrderFromETPS (next) {
                getStakeOrderFromETPS(next);
            },
            insertStakeOrdersInETP: ['getStakeOrderFromETPS', function (results, next) {
                insertStakeOrdersInETP(next, results.getStakeOrderFromETPS);
            }],
            checkFrozeAmountsInStakeOrders: ['insertStakeOrdersInETP', function (results, next) {
                checkFrozeAmountsInStakeOrders(next, results);
            }],
            updateMemAccountTable: ['checkFrozeAmountsInStakeOrders', function (results, next) {
                updateMemAccountTable(next, results.checkFrozeAmountsInStakeOrders);
            }],
            updateETPSUserDetail: ['updateMemAccountTable', function (results, next) {
                updateETPSUserDetail(next, results);
            }]
        }, (err) => {
            if (err) {
                library.logger.error(err.stack);
                return setImmediate(cb, err.toString());
            }
            return setImmediate(cb, null, { success: true, message: 'Successfully migrated' });
        });
    },

    validateExistingUser(req, cb) {
        const data = req.body.data;
        const username = Buffer.from((data.split('&')[0]).split('=')[1], 'base64').toString();
        const password = Buffer.from((data.split('&')[1]).split('=')[1], 'base64').toString();

        const hashPassword = crypto.createHash('md5').update(password).digest('hex');

        library.db.one(sql.validateExistingUser, {
            username,
            password: hashPassword
        }).then((userInfo) => {
            library.db.one(sql.findPassPhrase, {
                userName: username
            }).then((user) => {
                return setImmediate(cb, null, {
                    success: true,
                    userInfo: user
                });
            }).catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, 'Invalid username or password');
            });
        }).catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Invalid username or password');
        });
    },

    verifyUserToComment(req, cb) {
        if (!req.body.secret) {
            return setImmediate(cb, 'secret is missing');
        }
        const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
        const publicKey = library.ed.makePublicKeyHex(hash);
        let address = self.generateAddressByPublicKey(publicKey);
        library.db.query(sql.findTrsUser, {
            senderId: address
        })
            .then((trs) => {
                return setImmediate(cb, null, { address: trs[0].senderId });
            })
            .catch((err) => {
                return setImmediate(cb, err);
            });
    },

    senderAccountBalance(req, cb) {
        library.db.query(sql.checkSenderBalance, {
            sender_address: req.body.address
        }).then((bal) => {
            return setImmediate(cb, null, { balance: bal[0].balance });
        }).catch((err) => {
            return setImmediate(cb, err);
        });
    },

    getMigratedUsersList(req, cb) {
        library.db.query(sql.getMigratedList, {
            limit: req.body.limit,
            offset: req.body.offset
        })
            .then((users) => {
                return setImmediate(cb, null, {
                    migratedList: users,
                    count: users.length ? users[0].user_count : 0
                });
            }).catch((err) => {
            return setImmediate(cb, err);
        });
    },

    async getDashboardDDKData(req, cb) {
        try {
            const ddkCache = await cache.prototype.getJsonForKeyAsync('ddkCache');

            if (ddkCache) {
                return setImmediate(cb, null, ddkCache);
            } else {
                function getDDKData(t) {
                    const promises = [
                        t.one(frogings_sql.countStakeholders),
                        t.one(frogings_sql.getTotalStakedAmount),
                        t.one(sql.getTotalAccount)
                    ];

                    return t.batch(promises);
                }

                const results = await library.db.task(getDDKData);

                const ddkData = await (new Promise((resolve, reject) => {
                    Accounts.prototype.shared.getCirculatingSupply(req, function (err, data) {
                        if (err) {
                            reject(err);
                        }

                        resolve({
                            countStakeholders: results[0].count,
                            totalDDKStaked: results[1].sum,
                            totalAccountHolders: results[2].count,
                            totalCirculatingSupply: data.circulatingSupply
                        });
                    });
                }));

                await cache.prototype.setJsonForKeyAsync('ddkCache', ddkData, DDK_DATA_EXPIRE);
                setImmediate(cb, null, ddkData);
            }
        } catch (err) {
            return setImmediate(cb, err);
        }
    },

    checkAccountExists(req, cb) {
        library.schema.validate(req.body, schema.checkAccountExists, async (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }
            if (!await self.addressExists(req.body.address)) {
                return setImmediate(cb, 'Address is Invalid');
            }
            return setImmediate(cb, null, { success: true });
        });
    }
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Accounts.prototype.internal = {
    count(req, cb) {
        return setImmediate(cb, null, { success: true, count: Object.keys(__private.accounts).length });
    },

    top(query, cb) {
        self.getAccounts({
            sort: {
                balance: -1
            },
            offset: query.offset,
            limit: (query.limit || 100)
        }, (err, raw) => {
            if (err) {
                return setImmediate(cb, err);
            }

            const accounts = raw.map((account) => {
                return {
                    address: account.address,
                    balance: account.balance,
                    publicKey: account.publicKey
                };
            });

            return setImmediate(cb, null, { success: true, accounts });
        });
    },

    getAllAccounts(req, cb) {
        return setImmediate(cb, null, { success: true, accounts: __private.accounts });
    },

    lockAccount(req, cb) {
        library.schema.validate(req.body, schema.lockAccount, (err) => {
            if (!err) {
                if (!req.body.address) {
                    return setImmediate(cb, 'Missing required property: address');
                }
                const address = req.body.publicKey ? self.generateAddressByPublicKey(req.body.publicKey) : req.body.address;
                self.getAccount({ address: address }, (err, account) => {
                    if (err) {
                        return setImmediate(cb, err);
                    }
                    if (!account) {
                        const data = {};
                        data.status = 0;
                        data.address = req.body.address;
                        data.publicKey = req.body.publicKey;
                        if (req.body.accType) {
                            data.acc_type = req.body.accType;
                            const lastBlock = modules.blocks.lastBlock.get();
                            data.endTime = library.logic.contract.calcEndTime(req.body.accType, lastBlock.timestamp);
                            if (req.body.amount) {
                                data.transferedAmount = req.body.amount;
                            }
                            const REDIS_KEY_USER_INFO_HASH = `userInfo_${  data.address}`;
                            const REDIS_KEY_USER_TIME_HASH = `userTimeHash_${  data.endTime}`;
                            cache.prototype.isExists(REDIS_KEY_USER_INFO_HASH, (err, isExist) => {
                                if (!isExist) {
                                    const userInfo = {
                                        publicKey: data.publicKey,
                                        transferedAmount: data.transferedAmount,
                                        accType: req.body.accType
                                    };
                                    cache.prototype.hmset(REDIS_KEY_USER_INFO_HASH, userInfo);
                                    cache.prototype.hmset(REDIS_KEY_USER_TIME_HASH, userInfo);
                                    library.logic.contract.sendContractAmount([userInfo], (err) => {
                                        // FIXME: do further processing with "res" i.e send notification to the user
                                        if (err) {
                                            return setImmediate(cb, err);
                                        }
                                        library.logic.account.set(data.address, data, (err) => {
                                            if (!err) {
                                                data.startTime = lastBlock.timestamp;
                                                return setImmediate(cb, null, { account: data });
                                            } else {
                                                return setImmediate(cb, err);
                                            }
                                        });
                                    });
                                } else {
                                    return setImmediate(cb, null, { account: data });
                                }
                            });
                        }
                    } else {
                        library.db.one(sql.checkAccountStatus, {
                            senderId: account.address
                        })
                            .then((row) => {
                                if (row.status === 0) {
                                    return cb('Account is already locked');
                                }
                                library.db.none(sql.disableAccount, {
                                    senderId: account.address
                                })
                                    .then(() => {
                                        library.logger.info(`${account.address  } account is locked`);
                                        return setImmediate(cb, null, { account: account });
                                    })
                                    .catch((err) => {
                                        library.logger.error(err.stack);
                                        return setImmediate(cb, err);
                                    });
                            })
                            .catch((err) => {
                                library.logger.error(err.stack);
                                return setImmediate(cb, 'Transaction#checkAccountStatus error');
                            });
                    }
                });
            } else {
                return setImmediate(cb, err);
            }
        });
    },

    unlockAccount(req, cb) {
        library.schema.validate(req.body, schema.unlockAccount, (err) => {
            if (!err) {
                if (!req.body.address) {
                    return setImmediate(cb, 'Missing required property: address');
                }

                const address = req.body.publicKey ? self.generateAddressByPublicKey(req.body.publicKey) : req.body.address;
                library.db.none(sql.enableAccount, {
                    senderId: address
                })
                    .then(() => {
                        library.logger.info(`${address  } account is unlocked`);
                        return setImmediate(cb, null);
                    })
                    .catch((err) => {
                        return setImmediate(cb, err);
                    });
            } else {
                return setImmediate(cb, err);
            }
        });
    },

    logout(req, cb) {
        delete req.decoded;
        return setImmediate(cb, null);
    },

    generateQRCode(req, cb) {
        const user = {};
        if (!req.body.publicKey) {
            return setImmediate(cb, 'Missing address or public key');
        }
        user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
        const secret = speakeasy.generateSecret({ length: 30 });
        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            user.twofactor = {
                secret: '',
                tempSecret: secret.base32,
                dataURL: data_url,
                otpURL: secret.otpauth_url
            };
            library.cache.client.set(`2fa_user_${  user.address}`, JSON.stringify(user));
            return setImmediate(cb, null, { success: true, dataUrl: data_url });
        });
    },

    verifyOTP(req, cb) {
        const user = {};
        if (!req.body.publicKey) {
            return setImmediate(cb, 'Missing address or public key');
        }
        user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
        library.cache.client.get(`2fa_user_${  user.address}`, (err, userCred) => {
            if (!userCred) {
                return setImmediate(cb, 'Token expired or invalid OTP. Click resend to continue');
            }
            if (err) {
                return setImmediate(cb, err);
            }
            const user_2FA = JSON.parse(userCred);
            const verified = speakeasy.totp.verify({
                secret: user_2FA.twofactor.tempSecret,
                encoding: 'base32',
                token: req.body.otp,
                window: 6
            });
            if (!verified) {
                return setImmediate(cb, 'Invalid OTP!. Please enter valid OTP to SEND Transaction');
            }
            return setImmediate(cb, null, { success: true, key: user_2FA.twofactor.tempSecret });
        });
    },

    enableTwoFactor(req, cb) {
        const user = {};
        if (!req.body.key) {
            return setImmediate(cb, 'Key is missing');
        }
        if (!req.body.secret) {
            return setImmediate(cb, 'secret is missing');
        }
        if (!req.body.otp) {
            return setImmediate(cb, 'otp is missing');
        }
        const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
        const publicKey = library.ed.makePublicKeyHex(hash);

        user.address = modules.accounts.generateAddressByPublicKey(publicKey);
        library.cache.client.get(`2fa_user_${  user.address}`, (err, userCred) => {
            if (err) {
                return setImmediate(cb, err);
            }
            if (!userCred) {
                return setImmediate(cb, 'Key expired');
            }
            const user_2FA = JSON.parse(userCred);
            const verified = speakeasy.totp.verify({
                secret: req.body.key,
                encoding: 'base32',
                token: req.body.otp,
                window: 6
            });
            if (!verified) {
                return setImmediate(cb, 'Invalid OTP!. Please enter valid OTP to SEND Transaction');
            }
            user_2FA.twofactor.secret = req.body.key;
            library.cache.client.set(`2fa_user_${  user.address}`, JSON.stringify(user_2FA));
            return setImmediate(cb, null, { success: true, key: user_2FA.twofactor.tempSecret });
        });
    },

    disableTwoFactor(req, cb) {
        const user = {};
        if (!req.body.publicKey) {
            return setImmediate(cb, 'Missing address or public key');
        }
        user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
        library.cache.client.exists(`2fa_user_${  user.address}`, (err, isExist) => {
            if (isExist) {
                library.cache.client.del(`2fa_user_${  user.address}`);
            }
            return setImmediate(cb, null, {
                success: true,
                message: `Two Factor Authentication Disabled For ${  user.address}`
            });
        });
    },

    checkTwoFactorStatus(req, cb) {
        const user = {};
        if (!req.body.publicKey) {
            return setImmediate(cb, 'Missing address or public key');
        }
        user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
        library.cache.client.exists(`2fa_user_${  user.address}`, (err, isExist) => {
            if (isExist) {
                library.cache.client.get(`2fa_user_${  user.address}`, (err, userCred) => {
                    const user_2FA = JSON.parse(userCred);
                    if (user_2FA.twofactor.secret) {
                        return setImmediate(cb, null, { success: true });
                    }
                    return setImmediate(cb, null, { success: false });
                });
            } else {
                return setImmediate(cb, null, { success: false });
            }
        });
    },
    generatenpNewPassphase(req, cb) {
        let code = new Mnemonic(Mnemonic.Words.ENGLISH);
        code = code.toString();
        return setImmediate(cb, null, { success: true, passphase: code });
    },

    getWithdrawlStatus(req, cb) {
        library.schema.validate(req.body, schema.enablePendingGroupBonus, (err) => {
            if (err) {
                return setImmediate(cb, err);
            }

            let stakedAmount = 0,
                groupBonus = 0,
                pendingGroupBonus = 0,
                failedRule = [];
            async.auto({
                checkLastWithdrawl (seriesCb) {
                    library.cache.client.exists(req.body.address + '_pending_group_bonus_trs_id', function (err, isExists) {
                        if (isExists) {
                            library.cache.client.get(req.body.address + '_pending_group_bonus_trs_id', function (err, transactionId) {
                                if (err) {
                                    //failedRule[0] = false;
                                    seriesCb(null, false);
                                }
                                library.db.one(sql.findTrs, {
                                    transactionId: transactionId
                                })
                                    .then(function (transationData) {
                                        let d = constants.epochTime;
                                        let t = parseInt(d.getTime() / 1000);
                                        d = new Date((transationData.timestamp + t) * 1000);
                                        const timeDiff = (d - Date.now());
                                        const days = Math.ceil(Math.abs(timeDiff / (1000 * 60 * 60 * 24)));
                                        if (days > 7) {
                                            seriesCb(null, true);
                                        } else {
                                            seriesCb(null, false);
                                        }
                                    })
                                    .catch(function (err) {
                                        seriesCb(err, false);
                                    });
                            });
                        } else {
                            seriesCb(null, true);
                        }
                    });
                },
                checkActiveStake: ['checkLastWithdrawl', function (result, seriesCb) {
                    library.db.query(sql.findActiveStakeAmount, {
                        senderId: req.body.address
                    })
                        .then((stakeOrders) => {
                            if (stakeOrders.length > 0) {
                                stakedAmount = parseInt(stakeOrders[1].value) / 100000000;
                                seriesCb(null, true);
                            } else {
                                seriesCb(null, false);
                                // seriesCb('Rule 2 failed: You need to have at least one active stake order');
                            }
                        })
                        .catch((err) => {
                            seriesCb(err, false);
                        });
                }],

                checkActiveStakeOfLeftAndRightSponsor: ['checkActiveStake', function (result, seriesCb) {
                    let activeStakeCount = 0;
                    library.db.query(sql.findDirectSponsor, {
                        introducer: req.body.address
                    })
                        .then((directSponsors) => {
                            if (directSponsors.length >= 2) {
                                directSponsors.forEach((directSponsor) => {
                                    library.db.query(sql.findActiveStakeAmount, {
                                        senderId: directSponsor.address
                                    })
                                        .then((stakeInfo) => {
                                            const timeDiff = (slots.getTime() - stakeInfo[0].value);
                                            const days = Math.ceil(Math.abs(timeDiff / (1000 * 60 * 60 * 24)));
                                            if (stakedAmount && days <= 31) {
                                                activeStakeCount++;
                                            }
                                            if (activeStakeCount >= 2) {
                                                seriesCb(null, true);
                                            }
                                        })
                                        .catch((err) => {
                                            seriesCb(err, false);
                                        });
                                });
                            } else if (activeStakeCount < 2) {
                                seriesCb(null, false);
                            } else {
                                seriesCb(null, false);
                            }
                        })
                        .catch((err) => {
                            seriesCb(err, false);
                        });
                }],
                checkRatio: ['checkActiveStakeOfLeftAndRightSponsor', function (result, seriesCb) {
                    library.db.query(sql.findGroupBonus, {
                        senderId: req.body.address
                    })
                        .then((bonusInfo) => {
                            groupBonus = parseInt(bonusInfo[0].group_bonus) / 100000000;
                            pendingGroupBonus = parseInt(bonusInfo[0].pending_group_bonus) / 100000000;
                            if (pendingGroupBonus <= groupBonus && pendingGroupBonus > 0) {
                                nextBonus = (groupBonus - pendingGroupBonus) > 15 ? 15 : (groupBonus - pendingGroupBonus) !== 0 ? (groupBonus - pendingGroupBonus) : 15;
                                if (nextBonus > stakedAmount * 10) {
                                    nextBonus = stakedAmount * 10;
                                    pendingGroupBonus = groupBonus - nextBonus;
                                    seriesCb(null, true);
                                } else if ((groupBonus - pendingGroupBonus + nextBonus) < stakedAmount * 10) {
                                    pendingGroupBonus = groupBonus - nextBonus;
                                    seriesCb(null, true);
                                } else if (stakedAmount * 10 - (groupBonus - pendingGroupBonus) > 0) {
                                    nextBonus = stakedAmount * 10 - (groupBonus - pendingGroupBonus);
                                    pendingGroupBonus = groupBonus - nextBonus;
                                    seriesCb(null, true);
                                } else {
                                    seriesCb(null, false);
                                    // seriesCb('Rule 4 failed: Ratio withdrawal is 1:10 from own staking DDK.');
                                }
                            } else {
                                seriesCb(null, false);
                                // seriesCb('Either you don\'t have group bonus reserved or exhausted your withdrawl limit');
                            }
                        })
                        .catch((err) => {
                            seriesCb(err, false);
                        });
                }]
            }, (err, data) => {
                if (err) {
                    return setImmediate(cb, err, { success: false, status: data });
                }
                return setImmediate(cb, null, { success: true, status: data });
            });
        });
    },
    // TODO remove
    // sendWithdrawlAmount: function (req, cb) {
    // 	library.schema.validate(req.body, schema.enablePendingGroupBonus, function (err) {
    // 		if (err) {
    // 			return setImmediate(cb, err);
    // 		}
    // 		if (!nextBonus) {
    // 			return setImmediate(cb, 'You don\'t have pending group bonus remaining');
    // 		}
    // 		let hash = Buffer.from(JSON.parse(library.config.users[5].keys));
    // 		let keypair = library.ed.makeKeypair(hash);
    // 		let publicKey = keypair.publicKey.toString('hex');
    // 		library.balancesSequence.add(function (cb) {
    // 			self.getAccount({publicKey: publicKey}, function(err, account) {
    // 				if (err) {
    // 					return setImmediate(cb, err)
    // 				}
    // 				let transaction;
    // 				let secondKeypair = null;
    // 				account.publicKey = publicKey;
    //
    // 				library.logic.transaction.create({
    // 					type: transactionTypes.REWARD,
    // 					amount: nextBonus * 100000000,
    // 					sender: account,
    // 					recipientId: req.body.address,
    // 					keypair: keypair,
    // 					secondKeypair: secondKeypair,
    // 					trsName: 'WITHDRAWLREWARD'
    // 				}).then((transactionReward) =>{
    // 					transaction = transactionReward;
    // 					modules.transactions.receiveTransactions([transaction], true, cb);
    // 				}).catch((e) => {
    // 					return setImmediate(cb, e.toString());
    // 				});
    // 			});
    // 		}, function (err, transaction) {
    // 			if (err) {
    // 				return setImmediate(cb, err);
    // 			}
    // 			library.cache.client.set(req.body.address + '_pending_group_bonus_trs_id', transaction[0].id);
    // 			library.db.none(sql.updatePendingGroupBonus, {
    // 				nextBonus: nextBonus * 100000000,
    // 				senderId: req.body.address
    // 			})
    // 			.then(function () {
    // 				return setImmediate(cb, null, { transactionId: transaction[0].id });
    // 			})
    // 			.catch(function (err) {
    // 				return setImmediate(cb, err);
    // 			});
    // 		});
    // 	});
    // },
};

// Export
module.exports = Accounts;

/** ************************************* END OF FILE ************************************ */
