'use strict';

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

// let client = redis.createClient(config.redis.port, config.redis.host);

/* const promise = require('bluebird');
let pgOptions = {
    promiseLib: promise
}; */

/* let pgp = require('pg-promise')(pgOptions);

let cn = {
    host: config.db.host, // server name or IP address;
    port: config.db.port,
    database: config.db.database,
    user: process.env.USER,
    password: 'password'
};

let db = pgp(cn); */

let code, secret, hash, keypair, publicKey, user_address;
let referral_chain = [];
let self;
// Constructor
exports.AccountCreateETPS = function (scope) {
    this.scope = {
        balancesSequence: scope.balancesSequence,
        db: scope.db
    };
    self=this;
    etpsMigrationProcess();
}


/**
 * Registration process of Etps user in the DDK system.
 * Insert the fields to the member account.
 * @param {user_data} - Contains the address, balance, total freezed amount of Etps user.
 * @param {cb} - callback function which will return the status.
 */

function etpsTransaction(user_data, cb) {
    let etpsSecret = Buffer.from(user_data.passphrase, "base64").toString("ascii");

    let etphash = crypto.createHash('sha256').update(etpsSecret, 'utf8').digest();

    let etpskeypair = ed.makeKeypair(etphash);

    let publicKey = user_data.publicKey;

    let etps_account = {
        address: user_data.address,
        publicKey: user_data.publicKey
    };

    self.scope.balancesSequence.add(function (cb3) {
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

        transactionMod.prototype.receiveTransactions([transaction], true, cb3);

    }, function (err, transaction) {
        if (err) {
            return setImmediate(cb, err);
        }
        cb();
      //  return setImmediate(cb, null, { transactionId: transaction[0].id });
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
 * Generating the Passphrase , Public Key , Referral Chain of Etps User and save it to db.
 * Entries of Stake done by Etps User.
 * Update to the Member Account with Balance and total freezed amount.
 * @method async.series - Contains the array of functions or tasks with callback.
 */

function etpsMigrationProcess() {

async.series([
   /*  function (main_callback) {
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
                                series_callback(err);
                            });
                        },
                    ], function (err) {
                        if (err) {
                            callback(err);
                        }
                        console.log('Address , Passphrase and Referral chain created successfully');
                        callback();
                    });

                }).catch(function (err) {
                    callback(err);
                });

            }, function (err) {
                if (err) {
                    return main_callback(err);
                }
                main_callback();
                console.log('Successfully Inserted');
            });

        }).catch(function (err) {
            main_callback(err);
        });
    }, */
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

                            etps_balance = etps_balance + account.quantity;

                        }, function (err) {
                            if (err) {
                                callback(err);
                            }
                            etps_balance = etps_balance * 100000000;
                            let user_data = {
                                address: migrated_details.address,
                                publicKey: migrated_details.publickey,
                                balance: etps_balance,
                                group_bonus: migrated_details.group_bonus,
                                passphrase: migrated_details.passphrase
                            };

                            etpsTransaction(user_data,function(err){
                                if(err) {
                                    return  callback(err);
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

                        etpsTransaction(data,function(err){
                            if(err) {
                                return  callback(err);
                            }
                            etps_balance = 0;
                            callback();
                        });
                        // callback();
                    }

                }).catch(function (err) {
                    callback(err);
                });
            }, function (err) {
                if (err) {
                    return main_callback(err);
                }
                console.log('Stake Orders and Member Account created Successfully');
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
    console.log('Migration successfully Done');
});
}

