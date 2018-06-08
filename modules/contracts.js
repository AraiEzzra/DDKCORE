'use strict';

//Requiring Modules 
var Contract = require('../logic/contract.js');
var transactionTypes = require('../helpers/transactionTypes.js');
var sql = require('../sql/accounts.js');
var contributorsStatus = true;
var cache = require('./cache.js');
//var cronjob = require('node-cron-job');
//var path = require('path');

//Private Fields
var __private = {}, self = null,
library = null, modules = null;
__private.assetTypes = {};

//Contracts Constuctor Initialized from app.js
function Contracts(cb, scope) {
    library = {
		logger: scope.logger,
		sequence: scope.sequence,
		ed: scope.ed,
		db: scope.db,
		network: scope.network,
		schema: scope.schema,
		balancesSequence: scope.balancesSequence,
		logic: {
			transaction: scope.logic.transaction,
			contract: scope.logic.contract
		},
		config: {
			forging: {
				secret: scope.config.forging.secret,
				access: {
					whiteList: scope.config.forging.access.whiteList,
				},
			},
			contributors: scope.config.contributors
		},
    };
    
    self = this;
    self.type = transactionTypes.CONTRACT;

    __private.assetTypes[transactionTypes.CONTRACT] = library.logic.transaction.attachAssetType(
		transactionTypes.CONTRACT, new Contract(scope.config)
	);
    
    setImmediate(cb, null, self);
};

//OnBInd Event called from app.js
Contracts.prototype.onBind = function (scope) {
    modules = {
		loader: scope.loader,
		rounds: scope.rounds,
		accounts: scope.accounts,
		blocks: scope.blocks,
		transport: scope.transport,
		transactions: scope.transactions,
		delegates: scope.delegates,
    };
    __private.assetTypes[transactionTypes.CONTRACT].bind(
		scope.accounts, scope.logger
	);
}

module.exports = Contracts;