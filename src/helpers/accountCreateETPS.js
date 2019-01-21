/**
 * @author - Satish Joshi
 */

const Mnemonic = require('bitcore-mnemonic');
const crypto = require('crypto');
const ed = require('./ed.js');
const async = require('async');
const redis = require('../modules/cache');
const slots = require('./slots');
const constants = require('./constants');
const Logger = require('../logger.js');

const logman = new Logger();
const logger = logman.logger;
const sql = require('../sql/referal_sql');
const bignum = require('./bignum.js');
const transactionLog = require('../logic/transaction');
const transactionMod = require('../modules/transactions');
const transactionTypes = require('./transactionTypes');
const accounts = require('../modules/accounts');

let code,
    secret,
    hash,
    keypair,
    publicKey,
    user_address,
    migrationCount;
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
    setTimeout(() => {
        etpsMigrationProcess();
    }, 10000);
};

/**
 * Registration process of Etps user in the DDK system.
 * First send an transaction from an specific account to all etps users.
 * Then make an transaction of total stake amount for migrated users.
 * @param {user_data} - Contains the address, passphrase, balance, total freezed amount, group bonus of Etps user.
 * @param {cb} - callback function which will return the status.
 */

function updateSendTrs(user_data, cb) {
    self.scope.balancesSequence.add((cb3) => {
        const sender_hash = Buffer.from(JSON.parse(self.scope.config.users[8].keys));
        const sender_keypair = ed.makeKeypair(sender_hash);
        const sender_publicKey = sender_keypair.publicKey.toString('hex');

        accounts.prototype.setAccountAndGet({
            publicKey: sender_publicKey
        }, (err, account) => {
            if (err) {
                return setImmediate(cb, err);
            }

            const secondKeypair = null;

            let transaction;

            try {
                transaction = transactionLog.prototype.create({
                    type: (transactionTypes.SEND),
                    amount: user_data.balance,
                    sender: account,
                    recipientId: user_data.address,
                    keypair: sender_keypair,
                    secondKeypair,
                    trsName: 'SEND_MIGRATION'
                });
            } catch (e) {
                return setImmediate(cb, e.toString());
            }

            transactionMod.prototype.receiveTransactions([transaction], true, cb3);
        });
    }, (err, transaction) => {
        if (err) {
            return setImmediate(cb, err);
        }
        cb();
    });
}


function updateMigrationTrs(user_data, cb) {
    const etpsSecret = Buffer.from(user_data.passphrase, 'base64').toString('ascii');

    const etphash = crypto.createHash('sha256').update(etpsSecret, 'utf8').digest();

    const etpskeypair = ed.makeKeypair(etphash);

    const etps_account = {
        address: user_data.address,
        publicKey: user_data.publicKey
    };

    self.scope.balancesSequence.add((cb4) => {
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
    }, (err, transaction) => {
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
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    const temp = Buffer.alloc(8);

    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    const address = `DDK${bignum.fromBuffer(temp).toString()}`;

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
        checkLastMigratedUser(main_callback) {
            self.scope.db.query(sql.lastMigratedId)
                .then((lastInfo) => {
                    if (lastInfo.length && lastInfo[0].max) {
                        migrationCount = lastInfo[0].max;
                    } else {
                        migrationCount = 0;
                    }
                    logger.info(`Checking Migration Table In Case of Rebuilding & Resumes with ETPS ID : ${migrationCount}`);

                    main_callback();
                }).catch((err) => {
                main_callback(err);
            });
        },
        GenerateEtpsUserInfo(main_callback) {
            self.scope.db.query(sql.selectEtpsList, {
                etpsCount: migrationCount
            }).then((etps_list) => {
                if (etps_list.length) {
                    logger.info('Now Generating Passphrase, Address, Referral Chain for All ETPS User as well as Insertion of Stake Orders');

                    async.eachSeries(etps_list, (etps_user, callback) => {
                        code = new Mnemonic(Mnemonic.Words.ENGLISH);
                        secret = code.toString();

                        hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
                        keypair = ed.makeKeypair(hash);
                        publicKey = keypair.publicKey.toString('hex');

                        user_address = generateAddressByPublicKey(publicKey);

                        async.series({

                            updateEtpsPassphrase(series_callback) {
                                self.scope.db.none(sql.insertMigratedUsers, {
                                    address: user_address,
                                    passphrase: Buffer.from(secret).toString('base64'),
                                    username: etps_user.username,
                                    id: etps_user.id,
                                    publickey: publicKey,
                                    group_bonus: etps_user.group_bonus * 100000000
                                }).then(() => {
                                    const REDIS_KEY_USER = `userAccountInfo_${user_address}`;
                                    redis.prototype.setJsonForKey(REDIS_KEY_USER, JSON.stringify(user_address));

                                    series_callback();
                                }).catch((err) => {
                                    callback(err);
                                });
                            },
                            getDirectIntroducer(series_callback) {
                                if (etps_user.upline == '') {
                                    referral_chain.length = 0;
                                    series_callback();
                                } else {
                                    self.scope.db.query(sql.getDirectIntroducer, etps_user.upline).then((user) => {
                                        if (user.length) {
                                            referral_chain.unshift(user[0].address);
                                            self.scope.db.query(sql.referLevelChain, {
                                                address: user[0].address
                                            }).then((etps_upline) => {
                                                if (etps_upline != null && etps_upline.length != 0 && etps_upline[0].level != null) {
                                                    const chain_length = ((etps_upline[0].level.length) < 15) ? (etps_upline[0].level.length) : 14;

                                                    referral_chain = referral_chain.concat(etps_upline[0].level.slice(0, chain_length));
                                                }
                                                series_callback();
                                            }).catch((err) => {
                                                series_callback(err);
                                            });
                                        } else {
                                            referral_chain.length = 0;
                                            series_callback();
                                        }
                                    });
                                }
                            },
                            updateReferralChain(series_callback) {
                                const levelDetails = {
                                    address: user_address,
                                    level: referral_chain
                                };

                                if (levelDetails.level.length === 0) {
                                    levelDetails.level = null;
                                }

                                self.scope.db.none(sql.insertReferalChain, {
                                    address: levelDetails.address,
                                    level: levelDetails.level
                                }).then(() => {
                                    referral_chain.length = 0;
                                    series_callback();
                                }).catch(err => series_callback(err));
                            },
                            updateStakeOrders(series_callback) {
                                const date = new Date((slots.getTime()) * 1000);
                                self.scope.db.query(sql.getStakeOrders, etps_user.id).then((stake_list) => {
                                    if (stake_list.length && stake_list[0].quantity) {
                                        async.eachSeries(stake_list, (account, stakeCallback) => {
                                            const stake_details = {
                                                id: etps_user.id,
                                                startTime: slots.getTime(account.insert_time),
                                                insertTime: slots.getTime(),
                                                senderId: user_address,
                                                freezedAmount: account.quantity * 100000000,
                                                rewardCount: 6 - account.remain_month,
                                                nextVoteMilestone: (date.setMinutes(date.getMinutes() + constants.froze.vTime)) / 1000
                                            };
                                            self.scope.db.none(sql.insertStakeOrder, {
                                                id: stake_details.id,
                                                status: 1,
                                                startTime: stake_details.startTime,
                                                insertTime: stake_details.insertTime,
                                                senderId: stake_details.senderId,
                                                recipientId: null,
                                                freezedAmount: stake_details.freezedAmount,
                                                rewardCount: stake_details.rewardCount,
                                                voteCount: stake_details.rewardCount * 4,
                                                nextVoteMilestone: stake_details.nextVoteMilestone
                                            }).then(() => {
                                                stakeCallback();
                                            }).catch((err) => {
                                                stakeCallback(err);
                                            });
                                        }, (err) => {
                                            if (err) {
                                                return series_callback(err);
                                            }
                                            series_callback();
                                        });
                                    } else {
                                        series_callback();
                                    }
                                }).catch((err) => {
                                    series_callback(err);
                                });
                            }
                        }, (err) => {
                            if (err) {
                                return callback(err);
                            }
                            callback();
                        });
                    }, (err) => {
                        if (err) {
                            return main_callback(err);
                        }
                        logger.info('Address, Passphrase, Referral Chain and Stake Orders Inserted Successfully');
                        main_callback();
                    });
                } else {
                    logger.info('Migrated ETPS Table Already Updated & All ETPS users Info is Up to Date');
                    main_callback();
                }
            }).catch((err) => {
                main_callback(err);
            });
        },
        sendTransaction(main_callback) {
            let etpsAmount,
                lastSendTrs;

            self.scope.db.query(sql.lastSendTrs)
                .then((resp) => {
                    if (!resp.length) {
                        lastSendTrs = 0;
                    } else {
                        lastSendTrs = parseInt(resp[0].id);
                    }
                    logger.info(`Getting the Last ETPS ID Send Type Trx In Case of Rebuilding & Resumes on ETPS ID : ${lastSendTrs}`);

                    self.scope.db.query(sql.getMigratedUsers, {
                        lastetpsId: lastSendTrs
                    }).then((migrated_user) => {
                        if (migrated_user.length) {
                            logger.info('Send Type Transaction For Migrated Users Started Successfully ...');

                            async.eachSeries(migrated_user, (migrated_details, callback) => {
                                self.scope.db.query(sql.etpsuserAmount, {
                                    account_id: migrated_details.id
                                }).then((user) => {
                                    if (user.length && user[0].amount) {
                                        etpsAmount = user[0].amount;

                                        const user_details = {
                                            balance: Math.round(((etpsAmount).toFixed(4)) * 100000000),
                                            address: migrated_details.address
                                        };

                                        setTimeout(() => {
                                            updateSendTrs(user_details, (err) => {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                callback();
                                            });
                                        }, 400);
                                    } else {
                                        callback();
                                    }
                                }).catch((err) => {
                                    callback(err);
                                });
                            }, (err) => {
                                if (err) {
                                    return main_callback(err);
                                }
                                logger.info('Send Type Transaction Updated Successfully');
                                main_callback();
                            });
                        } else {
                            logger.info('Send Type Transaction For All Migrated Users Already Up to Date');
                            main_callback();
                        }
                    }).catch((err) => {
                        main_callback(err);
                    });
                }).catch((err) => {
                main_callback(err);
            });
        },
        migrateTransaction(main_callback) {
            let etpsAmount,
                lastMigrationTrs;
            self.scope.db.query(sql.lastMigrationTrs)
                .then((resp) => {
                    if (!resp.length) {
                        lastMigrationTrs = 0;
                    } else {
                        lastMigrationTrs = parseInt(resp[0].id);
                    }
                    logger.info(`Getting the Last ETPS ID Migration Type Trx In Case of Rebuilding & Resumes on ETPS ID : ${lastMigrationTrs}`);

                    self.scope.db.query(sql.getMigratedUsers, {
                        lastetpsId: lastMigrationTrs
                    }).then((migrated_user) => {
                        if (migrated_user.length) {
                            logger.info('Migration Type Transaction For Migrated Users Started Successfully ...');

                            async.eachSeries(migrated_user, (migrated_details, callback) => {
                                self.scope.db.query(sql.etpsuserAmount, {
                                    account_id: migrated_details.id
                                }).then((user) => {
                                    if (user.length) {
                                        if (!user[0].amount) {
                                            etpsAmount = 0;
                                        } else {
                                            etpsAmount = user[0].amount;
                                        }

                                        const user_details = {
                                            balance: Math.round(((etpsAmount).toFixed(4)) * 100000000),
                                            address: migrated_details.address,
                                            passphrase: migrated_details.passphrase,
                                            publicKey: migrated_details.publickey,
                                            group_bonus: migrated_details.group_bonus
                                        };

                                        setTimeout(() => {
                                            updateMigrationTrs(user_details, (err) => {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                callback();
                                            });
                                        }, 400);
                                    } else {
                                        callback();
                                    }
                                }).catch((err) => {
                                    callback(err);
                                });
                            }, (err) => {
                                if (err) {
                                    return main_callback(err);
                                }
                                logger.info('Migration Type Transaction Updated Successfully');
                                main_callback();
                            });
                        } else {
                            logger.info('Migration Type Transaction Already Up to Date For All Migrated Users');
                            main_callback();
                        }
                    }).catch((err) => {
                        main_callback(err);
                    });
                }).catch((err) => {
                main_callback(err);
            });
        }

    }, (err) => {
        if (err) {
            logger.error(`Migration ${err}`);
            return err;
        }
        logger.info('Migration Successfully Finised. Welcome To DDK');
    });
}
