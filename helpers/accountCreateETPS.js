'use strict';

let Mnemonic = require('bitcore-mnemonic');
let crypto = require('crypto');
let ed = require('./ed.js');
let modules = require('../modules/accounts.js');
let pgp = require("pg-promise")({});
let config = require('../config');
var async = require('async');
let redis = require('redis');
let logic = require('../logic/account');
let slots = require('./slots');
let constants = require('./constants');
let Logger = require('../logger.js');
let logman = new Logger();
let logger = logman.logger;

let client = redis.createClient(config.redis.port, config.redis.host);

let cn = {
    host: config.db.host, // server name or IP address;
    port: config.db.port,
    database: config.db.database,
    user: process.env.USER,
    password: 'password'
};

let db = pgp(cn);
let code, secret, hash, keypair, publicKey, user_address;
let referral_chain = [];

function insert(user_data, cb) {
    db.none('INSERT INTO mem_accounts ("address","u_isDelegate","isDelegate","publicKey","balance","u_balance","totalFrozeAmount","group_bonus") values (${address},${u_isDelegate},${isDelegate},${publicKey},${balance},${u_balance},${totalFrozeAmount},${group_bonus})', {
        address: user_data.address,
        u_isDelegate: 0,
        isDelegate: 0,
        publicKey: user_data.publicKey,
        balance: user_data.balance,
        u_balance: user_data.u_balance,
        totalFrozeAmount: user_data.totalFrozeAmount,
        group_bonus: user_data.group_bonus
    }).then(function () {
        cb(null);
    }).catch(function (err) {
        cb(err);
    });
}

async.series([
    function (main_callback) {
        db.many('SELECT * from etps_user').then(function (resp) {

            async.eachSeries(resp, function (etps_user, callback) {
                code = new Mnemonic(Mnemonic.Words.ENGLISH);
                secret = code.toString();

                hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
                keypair = ed.makeKeypair(hash);
                publicKey = keypair.publicKey.toString('hex');

                user_address = modules.prototype.generateAddressByPublicKey(publicKey);

                db.none('INSERT INTO migrated_etps_users ("address","passphrase","publickey","username","id","group_bonus") VALUES (${address},${passphrase},${publickey},${username},${id},${group_bonus})', {
                    address: user_address,
                    passphrase: secret,
                    username: etps_user.username,
                    id: etps_user.id,
                    publickey: publicKey,
                    group_bonus: etps_user.group_bonus * 100000000
                }).then(function () {

                    let REDIS_KEY_USER = "userInfo_" + user_address;
                    client.set(REDIS_KEY_USER, JSON.stringify(user_address));

                    async.series([
                        function (series_callback) {
                            if (etps_user.upline == '') {
                                referral_chain.length = 0;
                                series_callback();
                            } else {
                                db.query('SELECT address,COUNT(*) As username from migrated_etps_users WHERE username = $1 GROUP BY address;', etps_user.upline).then(function (user) {
                                    if (user.length) {
                                        referral_chain.unshift(user[0].address);
                                        db.query('SELECT level from referals WHERE "address" = ${address}', {
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

                            db.none('INSERT INTO referals ("address","level") VALUES (${address},${level})', {
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
                    main_callback(err);
                }
                main_callback();
                console.log('Successfully Inserted');
            });

        }).catch(function (err) {
            main_callback(err);
        });
    },
    function (main_callback) {
        let etps_balance = 0,
            frozeAmount = 0;
        let date = new Date((slots.getTime()) * 1000);
        db.query('SELECT * from migrated_etps_users').then(function (res) {
            async.eachSeries(res, function (migrated_details, callback) {
                db.query('SELECT * from existing_etps_assets_m WHERE account_id = $1', migrated_details.id).then(function (resp) {
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
                            db.none('INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","recipientId","freezedAmount","rewardCount","nextVoteMilestone") VALUES (${id},${status},${startTime},${insertTime},${senderId},${recipientId},${freezedAmount},${rewardCount},${nextVoteMilestone})', {
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
                            });

                            etps_balance = etps_balance + account.quantity;

                        }, function (err) {
                            if (err) {
                                callback(err);
                            }
                            frozeAmount = etps_balance * 100000000;
                            etps_balance = etps_balance * 100000000;
                            let user_data = {
                                address: migrated_details.address,
                                publicKey: Buffer.from(migrated_details.publickey, 'hex'),
                                balance: etps_balance,
                                u_balance: etps_balance,
                                totalFrozeAmount: frozeAmount,
                                group_bonus: migrated_details.group_bonus
                            };

                            insert(user_data, function (err) {
                                if (err) {
                                    callback(err);
                                }
                                etps_balance = 0;
                                frozeAmount = 0;
                                callback();
                            });

                        });
                    } else {
                        let data = {
                            address: migrated_details.address,
                            publicKey: Buffer.from(migrated_details.publickey, 'hex'),
                            balance: 0,
                            u_balance: 0,
                            totalFrozeAmount: 0,
                            group_bonus: migrated_details.group_bonus
                        }
                        insert(data, function (err) {
                            if (err) {
                                callback(err);
                            }
                            callback();
                        });
                    }

                }).catch(function (err) {
                    callback(err);
                });
            }, function (err) {
                if (err) {
                    main_callback(err);
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
        console.log(err);
        logger.error('Migration Error : ', err.stack);
        return err;
    }
    console.log('Migration successfully Done');
});
