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

let code, secret, hash, keypair, publicKey, user_address, migrationCount;
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
    setTimeout(function () {
        etpsMigrationProcess()
    }, 8000);
}

/**
 * Registration process of Etps user in the DDK system.
 * First send an transaction from an specific account to all etps users.
 * Then make an transaction of total stake amount for migrated users. 
 * @param {user_data} - Contains the address, passphrase, balance, total freezed amount, group bonus of Etps user.
 * @param {cb} - callback function which will return the status.
 */

function updateSendTrs(user_data, cb) {
    self.scope.balancesSequence.add(function (cb3) {

        let sender_hash = Buffer.from(JSON.parse(self.scope.config.users[8].keys));
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


function updateMigrationTrs(user_data, cb) {

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
 * First checking the status of migrated users by getting the last id in case of rebuilding the blockchain.
 * Then generating the Passphrase , Public Key , Referral Chain.
 * Also applying the stake orders of Etps User and save it to db.
 * After that also checking the last send or migrated type transaction updated in case of rebuilding.
 * And at last Apply with the 2 transactions (Send & Migration) which contains total amount froze by user.
 * @method async.series - Contains the object of functions or tasks with callback.
 */

function etpsMigrationProcess() {

    logger.info('Migration Started ...');

    async.series({
        checkLastMigratedUser: function (main_callback) {
            self.scope.db.query(sql.lastMigratedId)
                .then(function (lastInfo) {
                    if (lastInfo.length && lastInfo[0].max) {
                        migrationCount = lastInfo[0].max;
                    } else {
                        migrationCount = 0;
                    }

                    main_callback();

                }).catch(function (err) {
                    main_callback(err);
                });
        },
        GenerateEtpsUserInfo: function (main_callback) {

            self.scope.db.query(sql.selectEtpsList, {
                etpsCount: migrationCount
            }).then(function (etps_list) {

                if (etps_list.length) {

                    async.eachSeries(etps_list, function (etps_user, callback) {
                        code = new Mnemonic(Mnemonic.Words.ENGLISH);
                        secret = code.toString();

                        hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
                        keypair = ed.makeKeypair(hash);
                        publicKey = keypair.publicKey.toString('hex');

                        user_address = generateAddressByPublicKey(publicKey);

                        async.series({

                            updateEtpsPassphrase: function (series_callback) {
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

                                    series_callback();

                                }).catch(function (err) {
                                    callback(err);
                                });
                            },
                            getDirectIntroducer: function (series_callback) {
                                if (etps_user.upline == '') {
                                    referral_chain.length = 0;
                                    series_callback();
                                } else {
                                    self.scope.db.query(sql.getDirectIntroducer, etps_user.upline).then(function (user) {
                                        if (user.length) {
                                            referral_chain.unshift(user[0].address);
                                            self.scope.db.query(sql.referLevelChain, {
                                                address: user[0].address
                                            }).then(function (etps_upline) {
                                                if (etps_upline.length != 0 && etps_upline[0].level != null) {
                                                    let chain_length = ((etps_upline[0].level.length) < 15) ? (etps_upline[0].level.length) : 14;

                                                    referral_chain = referral_chain.concat(etps_upline[0].level.slice(0, chain_length));
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
                            updateReferralChain: function (series_callback) {
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
                            updateStakeOrders: function (series_callback) {
                                let date = new Date((slots.getTime()) * 1000);
                                self.scope.db.query(sql.getStakeOrders, etps_user.id).then(function (stake_list) {
                                    if (stake_list.length) {
                                        async.eachSeries(stake_list, function (account, stakeCallback) {
                                            let stake_details = {
                                                id: etps_user.id,
                                                startTime: slots.getTime(account.insert_time),
                                                insertTime: slots.getTime(),
                                                senderId: user_address,
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
                                                stakeCallback();
                                            }).catch(function (err) {
                                                stakeCallback(err);
                                            });

                                        }, function (err) {
                                            if (err) {
                                                return series_callback(err);
                                            }
                                            series_callback();

                                        });
                                    } else {
                                        series_callback();
                                    }

                                }).catch(function (err) {
                                    series_callback(err);
                                });

                            }
                        }, function (err) {
                            if (err) {
                                return callback(err);
                            }
                            callback();
                        });

                    }, function (err) {
                        if (err) {
                            return main_callback(err);
                        }
                        logger.info('Address , Passphrase, Referral chain and Stake Orders created successfully');
                        main_callback();
                    });
                } else {
                    main_callback();
                }

            }).catch(function (err) {
                main_callback(err);
            });

        },
        sendTransaction: function (main_callback) {
            let etpsAmount, lastSendTrs;

            self.scope.db.query(sql.lastSendTrs)
                .then(function (resp) {

                    if (!resp.length) {
                        lastSendTrs = 0;
                    } else {
                        lastSendTrs = parseInt(resp[0].id);
                    }
                    self.scope.db.query(sql.getMigratedUsers, {
                        lastetpsId: lastSendTrs
                    }).then(function (migrated_user) {
                        if (migrated_user.length) {
                            async.eachSeries(migrated_user, function (migrated_details, callback) {

                                self.scope.db.query(sql.etpsuserAmount, {
                                    account_id: migrated_details.id
                                }).then(function (user) {
                                    if (user.length && user[0].amount) {

                                        etpsAmount = user[0].amount;

                                        let user_details = {
                                            balance: Math.round(((etpsAmount).toFixed(4)) * 100000000),
                                            address: migrated_details.address
                                        }

                                        setTimeout(function () {
                                            updateSendTrs(user_details, function (err) {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                callback();
                                            });
                                        }, 350);

                                    } else {
                                        callback();
                                    }
                                }).catch(function (err) {
                                    callback(err);
                                });


                            }, function (err) {
                                if (err) {
                                    return main_callback(err);
                                }
                                logger.info('Send Type Transaction updated Successfully');
                                main_callback();
                            });
                        } else {
                            logger.info('Send Type Transaction already updated');
                            main_callback();
                        }
                    }).catch(function (err) {
                        main_callback(err);
                    });

                }).catch(function (err) {
                    main_callback(err);
                });

        },
        migrateTransaction: function (main_callback) {
            let etpsAmount, lastMigrationTrs;
            self.scope.db.query(sql.lastMigrationTrs)
                .then(function (resp) {
                    if (!resp.length) {
                        lastMigrationTrs = 0;
                    } else {
                        lastMigrationTrs = parseInt(resp[0].id);
                    }

                    self.scope.db.query(sql.getMigratedUsers, {
                        lastetpsId: lastMigrationTrs
                    }).then(function (migrated_user) {
                        if (migrated_user.length) {
                            async.eachSeries(migrated_user, function (migrated_details, callback) {

                                self.scope.db.query(sql.etpsuserAmount, {
                                    account_id: migrated_details.id
                                }).then(function (user) {
                                    if (user.length) {
                                        if (!user[0].amount) {
                                            etpsAmount = 0;
                                        } else {
                                            etpsAmount = user[0].amount;
                                        }

                                        let user_details = {
                                            balance: Math.round(((etpsAmount).toFixed(4)) * 100000000),
                                            address: migrated_details.address,
                                            passphrase: migrated_details.passphrase,
                                            publicKey: migrated_details.publickey,
                                            group_bonus: migrated_details.group_bonus
                                        }

                                        setTimeout(function () {
                                            updateMigrationTrs(user_details, function (err) {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                callback();
                                            });
                                        }, 350);

                                    } else {
                                        callback();
                                    }
                                }).catch(function (err) {
                                    callback(err);
                                });


                            }, function (err) {
                                if (err) {
                                    return main_callback(err);
                                }
                                logger.info('Migration Type Transaction updated Successfully');
                                main_callback();
                            });
                        } else {
                            logger.info('Send Type Transaction already updated');
                            main_callback();
                        }
                    }).catch(function (err) {
                        main_callback(err);
                    });
                }).catch(function (err) {
                    main_callback(err);
                });

        }

    }, function (err) {
        if (err) {
            console.log("ERROR = ", err);
            logger.error('Migration ' + err);
            return err;
        }
        logger.info('Migration successfully Done');
    });
}
