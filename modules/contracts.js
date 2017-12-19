/********************************************************************************
 * Added By Hotam Singh
 * 
 *******************************************************************************/

//Requiring Modules 
var Contract = require('../logic/contract.js');
var transactionTypes = require('../helpers/transactionTypes.js');
var sql = require('../sql/accounts.js');
var contributorsStatus = true;
var cache = require('./cache.js');

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
		transactionTypes.CONTRACT, new Contract()
	);
    
    setImmediate(cb, null, self);
};

//Unlock contributors/advisors/founders after a given time
Contracts.prototype.onNewBlock = function (block, broadcast, cb) {
	var REDIS_KEY_USER_TIME_HASH = "userInfo_" + block.timestamp;
	cache.prototype.isExists(REDIS_KEY_USER_TIME_HASH, function(err, isExist) {
		if(isExist) {
			cache.prototype.hgetall(REDIS_KEY_USER_TIME_HASH, function(err, data) {
				library.db.none(sql.enableAccount, { 
					senderId: data.address 
				}).then(function () {	   
					library.logger.info(data.address + ' account is unlocked');	
					cache.prototype.delHash(REDIS_KEY_USER_TIME_HASH);
				}).catch(function (err) {		 
					library.logger.error(err.stack);			
				});
			});
		}
	});
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