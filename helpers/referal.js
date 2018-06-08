'use strict';

var mailServices = require('./nodemailer');
var rewards = require('./rewards');
var async = require('async');
var env = process.env;

var library = {};

 exports.Referals =function(scope) {
    library = scope;
 }

 module.exports.api = function(app) {

    app.post('/referral/generateReferalLink', function(req, res) {

        var user_address = req.body.referralLink;
        var encoded = new Buffer(user_address).toString('base64');
        // var decoded = new Buffer(encoded, 'base64').toString('ascii');
        
        library.db.none('UPDATE mem_accounts SET "referralLink" = ${referralLink} WHERE "address" = ${address}', {
            referralLink: encoded,
            address: user_address
        }).then(function(){
            return res.status(200).json({ data: { success: true, referralLink: encoded } });
        }).catch(function (err) {
            return res.status(400).json({ data: { success: false, err: err.detail } });
        });

    });

    app.post('/referral/sendEmail',function(req,res){

        // Link to be get from request.
        // var link = req.protocol + "://" + req.host + ":" + library.config.app.port + '/login';
        var link = req.body.referlink;
        var mailOptions = {
            from: library.config.mailFrom, // sender address
            to: req.body.email, //req.body.email list of receivers, fix this before commit
            subject: 'Referral Link', // Subject line
            text: '', // plmodule.exportsain text body
            html: 'Hello, ' + req.body.email + ' <br><br>\
            <br> Please click on the Referral link below to register.<br><br>\
            <a href="'+ link + '">Click here to confirm</a>'
        };

        mailServices.sendMail(mailOptions, library.config, function (err) {
            if (err) {
                return res.status(400).json({ data: { success: false, err: err } });
            }
            return res.status(200).json({ data: { success: true, info: 'Mail sent successfully.' } });
        });
    });

    app.post('/referral/stakeReward',function(req,res){

        var amount = req.body.amount;
        var sponsor_address = req.body.address;
        var overrideReward = {}, i=0;

        library.db.one('SELECT level from referals WHERE "address" = ${address}',{
            address:sponsor_address
        }).then(function(user){
            
                if (user.level != null && user.level[0] != "0") {

                    overrideReward[user.level[i]] = (((env.STAKE_REWARD) * amount)/100)*100000000;

                    library.db.one('SELECT balance from mem_accounts WHERE "address" = ${sender_address}', {
                        sender_address: env.SENDER_ADDRESS
                    }).then(function (bal) {

                        if (parseInt(bal.balance) > 0) {

                            var transactionData = {
                                json: {
                                    secret: env.SENDER_SECRET,
                                    amount: overrideReward[user.level[i]],
                                    recipientId: user.level[i],
                                    transactionRefer: 11
                                }
                            };

                            library.logic.transaction.sendTransaction(transactionData, function (err, transactionResponse) {
                                if (err) return err;
                                console.log(transactionResponse.body);
                            });

                            return res.status(200).json({
                                data: {
                                    success: true,
                                    message: "Reward awarded successfully"
                                }
                            });

                        } else {
                            return res.status(200).json({
                                data: {
                                    success: true,
                                    rewards: 0,
                                    message: "Allocation is empty No reward"
                                }
                            });

                        }

                    }).catch(function (err) {
                        return res.status(400).json({
                            data: {
                                success: false,
                                err: err.message,
                                reward: 0
                            }
                        });
                    });
                }
            else {
                return res.status(200).json({
                    data: {
                        success: true,
                        reward: overrideReward,
                        message: "No Introducer Found"
                    }
                });
            }

        }).catch(function(err){
            return res.status(400).json({ data: { success: false, err: err.message, reward: 0 } });
        });

    });

    app.post('/referral/overridingReward',function(req,res){

        //address, amount
        var sponsor_address = req.body.sponser;
        var amount = req.body.amount;
        var overrideReward = {};
        var i = 0;

        library.db.one('SELECT level from referals WHERE "address" = ${address}',{
            address:sponsor_address
        }).then(function(user){

            if (user.level != null && user.level[0] != "0") {

            //     async.eachSeries(user.level,function(level,callback){

            //         if(i < 15)
            //         {
            //             overrideReward[level] = (((rewards.level[i]) * amount) / 100) * 100000000;

            //             library.db.one('SELECT balance from mem_accounts WHERE "address" = ${sender_address}', {
            //                 sender_address: rewards.sender_address
            //             }).then(function (bal) {

            //                 if (parseInt(bal.balance) > 0) {

            //                     var transactionData = {
            //                         json: {
            //                             secret: rewards.secret,
            //                             amount: overrideReward[level],
            //                             recipientId: level,
            //                             transactionRefer: 11
            //                         }
            //                     };

            //                     library.logic.transaction.sendTransaction(transactionData, function (err, transactionResponse) {
            //                         if (err) return err;
            //                         console.log(transactionResponse.body);
            //                     });

            //                 } else {
            //                     return res.status(200).json({
            //                         data: {
            //                             success: true,
            //                             rewards: 0,
            //                             message: "Allocation is empty No reward"
            //                         }
            //                     });

            //                 }

            //                 callback();

            //             }).catch(function (err) {
            //                 return res.status(400).json({
            //                     data: {
            //                         success: false,
            //                         err: err.message,
            //                         reward: 0
            //                     }
            //                 });
            //             });
            //         }
            //         else{
            //             callback();
            //         }
            //         i++;
            //     });

            for(i=0;i<user.level.length;i++)
            {
                if(i<15)
                {
                    overrideReward[user.level[i]] = (((rewards.level[i]) * amount) / 100) * 100000000;
                }
                else
                    overrideReward[user.level[i]] = 0;
                
            }



            }

            // return res.status(200).json({
            //     data: {
            //         success: true,
            //         message: "Reward awarded successfully"
            //     }
            // });

            return res.status(200).json({ data: { success: true, reward: overrideReward } });            

        }).catch(function(err){
            return res.status(400).json({ data: { success: false, err: err.message, overrideReward: 0 } });
        });

    });

 }



