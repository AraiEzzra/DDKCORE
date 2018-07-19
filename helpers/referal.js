'use strict';

let mailServices = require('./nodemailer');
let rewards = require('./rewards');
let async = require('async');
let sql = require('../sql/referal_sql');
let env = process.env;

let library = {};

exports.Referals = function (scope) {
    library = scope;
}

module.exports.api = function (app) {

    app.post('/referral/generateReferalLink', function (req, res) {

        let user_address = req.body.secret;
        let encoded = new Buffer(user_address).toString('base64');
        // var decoded = new Buffer(encoded, 'base64').toString('ascii');

        library.db.none(sql.updateReferLink, {
            referralLink: encoded,
            address: user_address
        }).then(function () {
            return res.status(200).json({
                success: true,
                referralLink: encoded
            });
        }).catch(function (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                err: err.detail
            });
        });

    });

    app.post('/referral/sendEmail', function (req, res) {

        let link = req.body.referlink;
        let mailOptions = {
            from: library.config.mailFrom, // sender address
            to: req.body.email, //req.body.email list of receivers, fix this before commit
            subject: 'Referral Link', // Subject line
            text: '', // plmodule.exportsain text body
            html: 'Hello, ' + req.body.email + ' <br><br>\
            <br> Please click on the Referral link below to register.<br><br>\
            <a href="' + link + '">Click here to confirm</a>'
        };

        mailServices.sendMail(mailOptions, library.config, function (err) {
            if (err) {
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

    app.post('/referral/list', function (req, res) {

        let hierarchy = {};

        let params = [],
            sponsorsList = [],
            level = 1;

        function arrayPush(resp) {
            for (let i = 0; i < resp.length; i++) {
                params.push('$' + (i + 1));
                sponsorsList.push(resp[i].address);
            }
        }

        function findSponsors(params, arr, cb) {
            if (level <= 15) {
                library.db.query('SELECT address from referals WHERE level[1] IN (' + params.join(',') + ')', arr)
                    .then(function (resp) {
                        params.length = 0;
                        sponsorsList.length = 0;
                        if (resp.length) {
                            (async function () {
                                await arrayPush(resp);
                            }());

                            hierarchy[level] = JSON.parse(JSON.stringify(sponsorsList));
                            level++;
                            findSponsors(params, sponsorsList, cb);
                        }
                        if (params.length == 0) {
                            return setImmediate(cb, null);
                        }
                    });
            } else {
                return setImmediate(cb, null);
            }
        }

        library.db.query('SELECT address from referals WHERE level[1] = ${address}', {
            address: req.body.referrer_address
        }).then(function (resp) {
            if (resp.length) {
                (async function () {
                    await arrayPush(resp);
                }());

                hierarchy[level] = JSON.parse(JSON.stringify(sponsorsList));
                level++;
                findSponsors(params, sponsorsList, function (err) {
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            error: err
                        });
                    }
                    return res.status(200).json({
                        success: true,
                        info: hierarchy
                    });
                });
            } else {
                return res.status(200).json({
                    success: true,
                    info: "No Sponsor Found"
                });
            }
        });

    });

}