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

    library.db.manyOrNone(sql.getReferralRewardHistory, {
        introducer_address: params.introducer_address,
        offset: params.offset,
        limit: params.limit
    })
    .then(row => setImmediate(cb, null, {
        rewards: row,
        count: (row && row.length) ? row[0].rewards_count : 0
    }))
    .catch(err => setImmediate(cb, 'Rewards#list error'));
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
     * @param {req} - contains the User Address, Level Info, Limit and Offset.
     * @param {res} - return the response with status of success or failure.
     * @returns {SponsorList} - contains the list of referals with stake info.
     * @returns {count} - contains the total users on a specific level.
     */

    app.post('/referral/list', (req, res) => {
        let addressInfo = req.body.userAddress;
        let levelIndicator = req.body.level;

        library.db.manyOrNone(sql.findReferralList, {
            levelInfo: levelIndicator,
            address: addressInfo,
            limit: req.body.limit,
            offset: req.body.offset
        }).then(function (user) {
            return res.status(200).json({
                success: true,
                SponsorList: user,
                count: (user && user.length) ? user[0].totalusers : 0
            });
        }).catch(function (err) {
            return res.status(400).json({
                success: false,
                error: err.stack
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
};
