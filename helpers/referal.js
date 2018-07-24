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

    /**
     * Generating a unique referral id through user address.
     * @param {req} - contains the address.
     * @param {res} - return the response with status of success or failure.
    */ 

    app.post('/referral/generateReferalLink', function (req, res) {

        let user_address = req.body.secret;
        let encoded = new Buffer(user_address).toString('base64');

        library.db.none(sql.updateReferLink, {
            referralLink: encoded,
            address: user_address
        }).then(function () {
            return res.status(200).json({
                success: true,
                referralLink: encoded
            });
        }).catch(function (err) {
            return res.status(400).json({
                success: false,
                err: err.detail
            });
        });

    });

    /** 
     * Referral Link sharing through email with the help of Nodemailer.
     * @param {req} - contains the referral link , email id.
     * @param {res} - return the response with status of success or failure. 
    */

    app.post('/referral/sendEmail', function (req, res) {

        let link = req.body.referlink;
        let mailOptions = {
            from: library.config.mailFrom, // sender address
            to: req.body.email, //req.body.email list of receivers
            subject: 'Referral Link', // Subject line
            text: '',
            html: 'Hello, ' + req.body.email + ' <br><br>\
            <br> Please click on the Referral link below to register.<br><br>\
            <a href="' + link + '">Click here to confirm</a>'
        };

        mailServices.sendMail(mailOptions, function (err) {
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

    /** 
     * Getting the stats of refers done by a user including it's referral chain.
     * @param {req} - contains the referrer address.
     * @param {res} - return the response with status of success or failure.
     */

    app.post('/referral/list', function (req, res) {

        let hierarchy = {};

        let params = [],
            referList = [],
            level = 1;

        function arrayPush(resp) {
            for (let i = 0; i < resp.length; i++) {
                params.push('$' + (i + 1));
                referList.push(resp[i].address);
            }
        }

        function findSponsors(params, arr, cb) {
            if (level <= 15) {
                library.db.query('SELECT address from referals WHERE level[1] IN (' + params.join(',') + ')', arr)
                    .then(function (resp) {
                        params.length = 0;
                        referList.length = 0;
                        if (resp.length) {
                            arrayPush(resp);
                            hierarchy[level] = JSON.parse(JSON.stringify(referList));
                            level++;
                            findSponsors(params, referList, cb);
                        }
                        if (params.length == 0) {
                            return setImmediate(cb, null);
                        }
                    })
                    .catch(function (err) {
                        return setImmediate(cb, err);
                    })
            } else {
                return setImmediate(cb, null);
            }
        }

        // Intitally the user which chain we have to find.
        params = ['$1'];
        referList = [req.body.referrer_address];

        findSponsors(params, referList, function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err
                });
            }
            return res.status(200).json({
                success: true,
                ReferList: hierarchy
            });
        });

    });

}