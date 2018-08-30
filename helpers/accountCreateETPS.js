/** 
 * @author - Satish Joshi 
 */

let Mnemonic = require('bitcore-mnemonic');
let crypto = require('crypto');
let ed = require('./ed.js');
let config = require('../config');
var async = require('async');
let redis = require('../modules/cache');
let logic = require('../logic/account');
let slots = require('./slots');
let constants = require('./constants');
let Logger = require('../logger.js');
let logman = new Logger();
let logger = logman.logger;
let sql = require('../sql/referal_sql');
let bignum = require('./bignum.js');
let transactionLog = require('../logic/transaction');
let transactionMod = require('../modules/transactions');
let transactionTypes = require('./transactionTypes');
let accounts = require('../modules/accounts');

let code, secret, hash, keypair, publicKey, user_address;
let referral_chain = [];
let self;
// Constructor
exports.AccountCreateETPS = function (scope) {
    this.scope = {
        balancesSequence: scope.balancesSequence,
        db: scope.db,
        config: scope.config
    };
    self = this;
    setTimeout(function() {etpsMigrationProcess()},8000);
}

/**
 * Registration process of Etps user in the DDK system.
 * Generated passphrase, address, referral chain of all the etps user.
 * Make an transaction of total stake amount for migrated users. 
 * @param {user_data} - Contains the address, balance, total freezed amount of Etps user.
 * @param {cb} - callback function which will return the status.
 */


function updateSendTrs(user_data, cb) {
    self.scope.balancesSequence.add(function (cb3) {

        let sender_hash = Buffer.from(JSON.parse(self.scope.config.users[6].keys));
        let sender_keypair = ed.makeKeypair(sender_hash);
        let sender_publicKey = sender_keypair.publicKey.toString('hex');

        accounts.prototype.setAccountAndGet({
            publicKey: sender_publicKey
        }, function (err, account) {
            if (err) {
                return setImmediate(cb, err);
            }

            let secondKeypair = null;

            let transaction;

            try {
                transaction = transactionLog.prototype.create({
                    type: (transactionTypes.SEND),
                    amount: user_data.balance,
                    sender: account,
                    recipientId: user_data.address,
                    keypair: sender_keypair,
                    secondKeypair: secondKeypair
                });
            } catch (e) {
                return setImmediate(cb, e.toString());
            }

            transactionMod.prototype.receiveTransactions([transaction], true, cb3);
        });
    }, function (err, transaction) {
        if (err) {
            return setImmediate(cb, err);
        }
        cb();
    });
}


function etpsTransaction(user_data, cb) {

    setTimeout(function () {

        let etpsSecret = Buffer.from(user_data.passphrase, "base64").toString("ascii");

        let etphash = crypto.createHash('sha256').update(etpsSecret, 'utf8').digest();

        let etpskeypair = ed.makeKeypair(etphash);

        let etps_account = {
            address: user_data.address,
            publicKey: user_data.publicKey
        };

        self.scope.balancesSequence.add(function (cb4) {
            let transaction;

            try {
                transaction = transactionLog.prototype.create({
                    type: transactionTypes.MIGRATION,
                    amount: user_data.balance,
                    sender: etps_account,
                    keypair: etpskeypair,
                    secondKeypair: null,
                    groupBonus: user_data.group_bonus,
                    totalFrozeAmount: user_data.balance
                });
            } catch (e) {
                return setImmediate(cb, e.toString());
            }

            transactionMod.prototype.receiveTransactions([transaction], true, cb4);

        }, function (err, transaction) {
            if (err) {
                return setImmediate(cb, err);
            }
            cb();
        });
    }, 300);
}

/**
 * Generates the address with the help of publick key.
 * @param {publicKey} - Generated publick key.
 * @returns {address} - Returns user address generated through public key.
 */

function generateAddressByPublicKey(publicKey) {
    let publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    let temp = Buffer.alloc(8);

    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    let address = 'DDK' + bignum.fromBuffer(temp).toString();

    return address;
}

/** 
 * Generating the Passphrase , Public Key , Referral Chain of Etps User and save it to db.
 * Entries of Stake done by Etps User.
 * Updated with the transaction contains total freezed amount.
 * @method async.series - Contains the array of functions or tasks with callback.
 */

function etpsMigrationProcess() {

    logger.info('Migration Started ...');

    async.series([
        function (main_callback) {
            self.scope.db.many(sql.selectEtpsList).then(function (resp) {

                async.eachSeries(resp, function (etps_user, callback) {
                    code = new Mnemonic(Mnemonic.Words.ENGLISH);
                    secret = code.toString();

                    hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
                    keypair = ed.makeKeypair(hash);
                    publicKey = keypair.publicKey.toString('hex');

                    user_address = generateAddressByPublicKey(publicKey);

                    self.scope.db.none(sql.insertMigratedUsers, {
                        address: user_address,
                        passphrase: Buffer.from(secret).toString('base64'),
                        username: etps_user.username,
                        id: etps_user.id,
                        publickey: publicKey,
                        group_bonus: etps_user.group_bonus * 100000000
                    }).then(function () {

                        let REDIS_KEY_USER = "userAccountInfo_" + user_address;
                        redis.prototype.setJsonForKey(REDIS_KEY_USER, JSON.stringify(user_address));

                        async.series([
                            function (series_callback) {
                                if (etps_user.upline == '') {
                                    referral_chain.length = 0;
                                    series_callback();
                                } else {
                                    self.scope.db.query(sql.getDirectIntroducer, etps_user.upline).then(function (user) {
                                        if (user.length) {
                                            referral_chain.unshift(user[0].address);
                                            self.scope.db.query(sql.referLevelChain, {
                                                address: user[0].address
                                            }).then(function (resp) {
                                                if (resp.length != 0 && resp[0].level != null) {
                                                    let chain_length = ((resp[0].level.length) < 15) ? (resp[0].level.length) : 14;

                                                    referral_chain = referral_chain.concat(resp[0].level.slice(0, chain_length));
                                                }
                                                series_callback();
                                            }).catch(function (err) {
                                                series_callback(err);
                                            });
                                        } else {
                                            referral_chain.length = 0;
                                            series_callback();
                                        }
                                    });
                                }
                            },
                            function (series_callback) {
                                let levelDetails = {
                                    address: user_address,
                                    level: referral_chain
                                };

                                if (levelDetails.level.length === 0) {
                                    levelDetails.level = null;
                                }

                                self.scope.db.none(sql.insertReferalChain, {
                                    address: levelDetails.address,
                                    level: levelDetails.level
                                }).then(function () {
                                    referral_chain.length = 0;
                                    series_callback();
                                }).catch(function (err) {
                                    return series_callback(err);
                                });
                            },
                            function (series_callback) {
                                self.scope.db.query(sql.etpsuserAmount, {
                                    account_id: etps_user.id
                                }).then(function (user) {
                                    if (user.length && user[0].amount) {
                                        let user_details = {
                                            balance: Math.round(((user[0].amount).toFixed(4)) * 100000000),
                                            address: user_address
                                        }
                                        setTimeout(function () {
                                            updateSendTrs(user_details, function (err) {
                                                if (err) {
                                                    return series_callback(err);
                                                }
                                                series_callback();
                                            });
                                        }, 300);

                                    } else {
                                        series_callback();
                                    }
                                }).catch(function (err) {
                                    series_callback(err);
                                });
                            }
                        ], function (err) {
                            if (err) {
                                return callback(err);
                            }
                            callback();
                        });

                    }).catch(function (err) {
                        callback(err);
                    });

                }, function (err) {
                    if (err) {
                        return main_callback(err);
                    }
                    logger.info('Address , Passphrase, Referral chain created successfully');
                    main_callback();
                });

            }).catch(function (err) {
                main_callback(err);
            });
        },
        function (main_callback) {
            let etps_balance = 0;
            self.scope.db.many(sql.getMigratedUsers).then(function (res) {
                async.eachSeries(res, function (migrated_details, callback) {
                    let date = new Date((slots.getTime()) * 1000);

                    self.scope.db.query(sql.getStakeOrders, migrated_details.id).then(function (resp) {
                        if (resp.length) {
                            async.eachSeries(resp, function (account, callback2) {
                                let stake_details = {
                                    id: migrated_details.id,
                                    startTime: slots.getTime(account.insert_time),
                                    insertTime: slots.getTime(),
                                    senderId: migrated_details.address,
                                    freezedAmount: account.quantity * 100000000,
                                    rewardCount: 6 - account.remain_month,
                                    nextVoteMilestone: (date.setMinutes(date.getMinutes() + constants.froze.vTime)) / 1000
                                }
                                self.scope.db.none(sql.insertStakeOrder, {
                                    id: stake_details.id,
                                    status: 1,
                                    startTime: stake_details.startTime,
                                    insertTime: stake_details.insertTime,
                                    senderId: stake_details.senderId,
                                    recipientId: null,
                                    freezedAmount: stake_details.freezedAmount,
                                    rewardCount: stake_details.rewardCount,
                                    nextVoteMilestone: stake_details.nextVoteMilestone
                                }).then(function () {
                                    callback2();
                                }).catch(function (err) {
                                    callback2(err);
                                });
                                // let bal = (account.quantity % 1 !=0) ? ((account.quantity).toFixed(4).toString().replace(/[0]+$/, '')):account.quantity.toString();
                                // etps_balance = etps_balance + parseFloat(bal) ;

                                etps_balance = etps_balance + (account.quantity);

                            }, function (err) {
                                if (err) {
                                    return callback(err);
                                }
                                etps_balance = parseFloat(etps_balance.toFixed(4)) * 100000000;
                                let user_data = {
                                    address: migrated_details.address,
                                    publicKey: migrated_details.publickey,
                                    balance: Math.round(etps_balance),
                                    group_bonus: migrated_details.group_bonus,
                                    passphrase: migrated_details.passphrase
                                };

                                etpsTransaction(user_data, function (err) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    etps_balance = 0;
                                    callback();
                                });

                            });
                        } else {
                            let data = {
                                address: migrated_details.address,
                                publicKey: migrated_details.publickey,
                                balance: 0,
                                group_bonus: migrated_details.group_bonus,
                                passphrase: migrated_details.passphrase
                            }

                            etpsTransaction(data, function (err) {
                                if (err) {
                                    return callback(err);
                                }
                                etps_balance = 0;
                                callback();
                            });
                        }

                    }).catch(function (err) {
                        callback(err);
                    });
                }, function (err) {
                    if (err) {
                        return main_callback(err);
                    }
                    logger.info('Stake Orders and Migration Transaction updated Successfully');
                    main_callback();
                });
            }).catch(function (err) {
                main_callback(err);
            });
        }

    ], function (err) {
        if (err) {
            console.log("ERROR = ", err);
            logger.error('Migration Error : ', err.stack);
            return err;
        }
        logger.info('Migration successfully Done');
    });
}

