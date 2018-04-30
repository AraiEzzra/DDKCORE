'use strict';

var jwt = require('jsonwebtoken');
var config = require('./config');
var jwtSecret = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, jwtSecret, function (err, decoded) {
            if (err) {
                return res.send({
                    error: true,
                    message: err
                })
            }
            let currTime = Math.floor(Date.now() / 1000);
            if (currTime < decoded.exp) { 
                //Refresh Token
                
                delete decoded.iat;
                delete decoded.exp;
                var refreshToken = jwt.sign(decoded, jwtSecret, {
                    expiresIn: config.jwt.tokenLife
                });
                return res.status(200).json({
                    status: true,
                    data: {
                        success: true,
                        refreshToken: refreshToken
                    }
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(204).send({
            error: true,
            message: "No Token Provided"
        })
    }
};