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

//Contract will run to transfer amount to contributors after 3 months once the network up
Contract.prototype.sendToContrubutors = function(contributors) {
    contributors.forEach(function(recipientId) {
       
        //Request to send tarnsaction
        var jsonData = {
            json : {
                secret: config.users[0].secret,
                amount: 20000000000,
                recipientId: recipientId,
                publicKey: config.users[0].publicKey
            }
        }; 

        request.put('http://localhost:7000/api/transactions/', jsonData, function(error, response, body) {
            if(error) throw error;
            if(response && response.statusCode == 200) {
                console.log('body:', body);
            }else {
                console.log('there is an error and status coddelegatee is : ' + response.statusCode);
                console.log('body : ' + JSON.stringify(body));
            }
        });
        
    });
};

//Basic Contract runs when Blocks height reaches to 5
/*Contract.prototype.runContract = function (height) {
    if (isNaN(height)) {
		throw 'Invalid block height';
	} else {
        var height = Math.abs(height);
        console.log('Executing smart contract');

        //Request to send tarnsaction
        var jsonData = {
            json : {
                secret: 'hen worry two thank unfair salmon smile oven gospel grab latin reason',
                amount: 2000000000,
                recipientId: '5143663806878841341E',
                publicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2'
            }
        }; 

        request.put('http://localhost:7000/api/transactions/', jsonData, function(error, response, body) {
            if(error) throw error;
            if(response && response.statusCode == 200) {
                console.log('type of body : ', typeof(body));
                console.log('body:', body);
            }else {
                console.log('there is an error and status coddelegatee is : ' + response.statusCode);
                console.log('body : ' + JSON.stringify(body));
            }
        });
	}
};*/

//Bind modules. Initially bound accounts.js module
Contract.prototype.bind = function (accounts) {
	modules = {
		accounts: accounts,
    };
};

module.exports = Contract;