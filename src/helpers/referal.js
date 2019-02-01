/**
 * @author - Satish Joshi
 */

const mailServices = require('./postmark');
const async = require('async');
const sql = require('../sql/referal_sql');
const OrderBy = require('./orderBy.js');
const constants = require('./constants.js');

let library = {},
    __private = {};

exports.Referals = function (scope) {
    library = scope;
};

/**
 * Get filtered list of rewards history
 *
 * @private
 * @async
 * @method list
 * @param  {Object}   filter Conditions to filter with
 * @param  {string}   filter.address addres of user whose reward we have to get
 * @param  {number}   filter.limit Limit of rewards to retrieve, default: 100, max: 100
 * @param  {number}   filter.offset Offset from where to start
 * @param  {string}   filter.orderBy Sort order, default: reward_time:desc
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 * @return {Object}   cb.data List of referral rewards received.
 */

__private.list = function (filter, cb) {
    let params = {},
        where = [];

    if (filter.address) {
        where.push('"introducer_address"=${introducer_address}');
        params.introducer_address = filter.address;
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

    if (params.limit > 100) {
        return setImmediate(cb, 'Invalid limit. Maximum is 100');
    }

    const orderBy = OrderBy(
        (filter.orderBy || 'reward_time:desc'), {
            sortFields: sql.sortFields
        }
    );

    if (orderBy.error) {
        return setImmediate(cb, orderBy.error);
    }

    /** Previous Code */

/*     library.db.query(sql.list({
        where,
        sortField: orderBy.sortField,
        sortMethod: orderBy.sortMethod
    }), params).then((rows) => {
        let count = 0;
        if (rows && rows.length !== 0) {
            count = Number(rows[0].total_rows);
        }

        const data = {
            rewards: rows,
            count
        };

        return setImmediate(cb, null, data);
    }).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'Rewards#list error');
    }); */

    /** Resolved Count Issue on Response with Updated Code */

    library.db.query(sql.countList({
        where: where
    }), params).then(function (rows) {
        let count = rows[0].count;

        library.db.query(sql.list({
            where: where,
            sortField: orderBy.sortField,
            sortMethod: orderBy.sortMethod
        }), params).then(function (rows) {

            let data = {
                rewards: rows,
                count: count
            };

            return setImmediate(cb, null, data);
        }).catch(function (err) {
            library.logger.error('Error Message : ' + err.message + ' , Error query : ' + err.query + ' , Error stack : ' + err.stack);
            return setImmediate(cb, 'Rewards#list error');
        });
    }).catch(function (err) {
        library.logger.error('Error Message : ' + err.message + ' , Error query : ' + err.query + ' , Error stack : ' + err.stack);
        return setImmediate(cb, 'Rewards#list error');
    });



};

module.exports.api = function (app) {
    /**
     * Referral Link sharing through email with the help of Postmark.
     * @param {req} - contains the referral link and email id.
     * @param {res} - return the response with status of success or failure.
     */

    app.post('/referral/sendEmail', (req, res) => {
        const referral_link = req.body.referlink;
        const mailOptions = {
            From: library.config.mailFrom, // sender address
            To: req.body.email, // req.body.email list of receivers
            TemplateId: constants.TemplateId.referralMail,
            TemplateModel: {
                person: {
                    username: req.body.email,
                    referral_link
                }
            }
        };

        mailServices.sendEmailWithTemplate(mailOptions, (err) => {
            if (err) {
                library.logger.error(`Send Email Error : ${err.stack}`);
                return res.status(400).json({
                    success: false,
                    error: err
                });
            }
            return res.status(200).json({
                success: true,
                info: 'Mail sent successfully'
            });
        });
    });

    /**
     * Getting the stats of referrals done with including it's referral chain.
     * @param {req} - contains the referrer address.
     * @param {res} - return the response with status of success or failure.
     * @returns {hierarchy} - contains the list of referals with its level info.
     */

    app.post('/referral/list', (req, res) => {
        const hierarchy = [];

        let referList = [],
            level = req.body.level,
            index = 0;

        let limit = 1;

        if (level > 1) {
            level++;
        }

        function findSponsors(arr, cb) {
            if (limit <= 5 && level <= 15) {
                library.db.query(sql.findReferralList, {
                        refer_list: arr
                    })
                    .then((resp) => {
                        referList.length = 0;
                        if (resp.length) {
                            async.each(resp, (user, callback) => {
                                referList.push(user.address);

                                callback();
                            }, (err) => {
                                if (err) {
                                    return setImmediate(cb, err);
                                }
                                hierarchy[index] = {
                                    Level: level,
                                    addressList: JSON.parse(JSON.stringify(referList)),
                                    count: referList.length
                                };
                                level++;
                                index++;
                                limit++;
                                findSponsors(referList, cb);
                            });
                        }
                        if (referList.length == 0) {
                            return setImmediate(cb, null);
                        }
                    })
                    .catch(err => setImmediate(cb, err));
            } else {
                return setImmediate(cb, null);
            }
        }

        // Intitally the user whose chain we have to find.
        referList = [req.body.referrer_address];

        findSponsors(referList, (err) => {
            if (err) {
                library.logger.error(`Referral List Error : ${err.stack}`);
                return res.status(400).json({
                    success: false,
                    error: err
                });
            }
            let key = 0;
            async.eachSeries(hierarchy, (status, callback) => {
                library.db.query(sql.findTotalStakeVolume, {
                    address_list: status.addressList
                }).then((resp) => {
                    if (!resp[0].freezed_amount) {
                        hierarchy[key].totalStakeVolume = 0;
                    } else {
                        hierarchy[key].totalStakeVolume = parseInt(resp[0].freezed_amount) / 100000000;
                    }
                    key++;
                    callback();
                }).catch(err => callback(err));
            }, (err) => {
                if (err) {
                    return setImmediate(callback, err);
                }

                return res.status(200).json({
                    success: true,
                    SponsorList: hierarchy
                });

            });


        });

    });

    /**
     * It will get all the rewards received either by Direct or Chain referral.
     * Also contains the sponsor information like its address, level, transaction type, reward amount, reward time.
     * @param {req} - It consist of user address.
     * @returns {SponsorList} - It contains the list of rewards received from sponsors.
     * @returns {count} - It contains the total count of rewards received.
     */

    app.post('/referral/rewardHistory', (req, res) => {
        __private.list(req.body, (err, data) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err
                });
            }
            return res.status(200).json({
                success: true,
                SponsorList: data.rewards,
                count: data.count
            });
        });
    });

    /**
     * It will gather the status of the sponsors stake orders.
     * It will return the status either Active or Inactive.
     * @param {req} - It consist of user address.
     * @returns {sponsorStatus} - Returns the status of stake order.
     */

    app.post('/sponsor/stakeStatus', (req, res) => {
        const address = req.body.address;
        let stats = [],
            addressList,
            i = 0;

        library.db.query(sql.findSponsorStakeStatus, {
            sponsor_address: address
        }).then((stake_status) => {
            addressList = stake_status.map(item => item.senderId);

            async.each(address, (user, callback) => {
                if (addressList.indexOf(user) != -1) {
                    stats[i] = {
                        address: user,
                        status: 'Active'
                    };
                } else {
                    stats[i] = {
                        address: user,
                        status: 'Inactive'
                    };
                }

                i++;

                callback();
            }, (err) => {
                if (err) {
                    library.logger.error(err.stack);
                    return res.status(400).json({
                        success: false,
                        error: err
                    });
                }

                return res.status(200).json({
                    success: true,
                    sponsorStatus: stats,
                });
            });
        }).catch((err) => {
            library.logger.error(err.stack);
            return res.status(400).json({
                success: false,
                error: err
            });
        });
    });
};
