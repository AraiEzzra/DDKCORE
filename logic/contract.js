/********************************************************************************
 * Added By Hotam Singh
 * 
 *******************************************************************************/

'use strict';

//Requiring Modules
var request = require('request');
var constants = require('../helpers/constants.js');
var config = require('../config.json');

// Private fields
var modules, library, self;

//Contract constructor initialized from modules/contracts.js's constructor
function Contract() {
    self = this;
};

//To be implemented as per requirement
Contract.prototype.create = function (data, trs) {
    return trs;
};

//To be implemented as per requirement
Contract.prototype.calculateFee = function (trs) {
    return 0;
};

//To be implemented as per requirement
Contract.prototype.verify = function (trs, sender, cb, scope) {
    setImmediate(cb, null, trs);
};

//To be implemented as per requirement
Contract.prototype.getBytes = function (trs) {
    return null;
};

//To be implemented as per requirement
Contract.prototype.apply = function (trs, sender, cb, scope) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.undo = function (trs, sender, cb, scope) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.ready = function (trs, sender, cb, scope) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.save = function (trs, cb) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.dbRead = function (row) {
    return null;
};
//To be implemented as per requirement
Contract.prototype.objectNormalize = function (asset, cb) {
    setImmediate(cb);
};

//To be implemented as per requirement
Contract.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

//Calculate end time based on current timestamp
Contract.prototype.calcEndTime = function(accType, startTime) {
    var date = new Date(startTime * 1000);
    if(accType == 1 || accType == 0) {
        var endTime = (date.setMinutes(date.getMinutes() + 90 * 24 * 60 * 60 ))/1000;
    }else if(accType == 2) {
        var endTime = (date.setMinutes(date.getMinutes() + 90 * 24 * 60 * 60 ))/1000;
    }else if(accType == 3) {
        var endTime = (date.setMinutes(date.getMinutes() + 365 * 24 * 60 * 60 ))/1000;
    }
    //var endTime = (date.setMinutes(date.getMinutes() + 2 ))/1000;
    return endTime;
};

//Contract will run to transfer amount to contributors after 3 months once the network up
Contract.prototype.sendToContrubutors = function(contributors) {
    contributors.forEach(function(recipient) {
       
        //Request to send tarnsaction
        var jsonData = {
            json : {
                secret: config.users[0].secret,
                amount: recipient.transferedAmount,
                recipientId: recipient.address,
                publicKey: config.users[0].publicKey
            }
        }; 

        request.put('http://localhost:7000/api/transactions/', jsonData, function(error, response, body) {
            if(error) throw error;
        });
        
    });
};

//Bind modules. Initially bound accounts.js module
Contract.prototype.bind = function (accounts) {
	modules = {
		accounts: accounts,
    };
};

module.exports = Contract;