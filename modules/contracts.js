/********************************************************************************
 * Added By Hotam Singh
 * 
 *******************************************************************************/

//Requiring Modules 
var Contract = require('../logic/contract.js');
var transactionTypes = require('../helpers/transactionTypes.js');
var sql = require('../sql/frogings.js');
var contributorsStatus = true;

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

//Running smart contract to send transaction and lock/unlock contributors after a given time
Contracts.prototype.onNewBlock = function (block, broadcast, cb) {
	if(block.height == 2) {
		library.logic.contract.calcEndTime(block.timestamp, library.config.contributors.lockTime, function(err, endTime) {
			var initialContirbutors = {
				users: library.config.contributors.users,
				endTime: endTime
			};
			library.config.contributors.lockStatus.push(initialContirbutors);
			var contributors = library.config.contributors.users;
			library.logic.contract.sendToContrubutors(contributors);
			contributors.forEach(function(senderId) {
				library.db.none(sql.disableAccount, { 
					senderId: senderId 
				}).then(function () {	   
					library.logger.info(senderId + ' account is locked for ' + library.config.contributors.lockTime +' months');	
				}).catch(function (err) {		 
					library.logger.error(err.stack);			
				});
			});
		});	
	}

	//Unlock contributor's account after 3 months(currently 3 minutes) 
	var lockIndex = library.config.contributors.lockIndex;
	if(block.height > 2 && library.config.contributors.lockStatus.length >= lockIndex + 1) {
		if(block.timestamp == library.config.contributors.lockStatus[lockIndex].endTime) {
			library.config.contributors.lockIndex = lockIndex + 1;
			if(library.config.contributors.newUsers && library.config.contributors.newUsers.length > 0) {
				var contributors = library.config.contributors.newUsers;
			}else {
				var contributors = library.config.contributors.users;
			}
			var response = [];
			contributors.forEach(function(senderId) {
				library.db.none(sql.enableAccount, { 
					senderId: senderId 
				}).then(function () {	   
					library.logger.info(senderId + ' account is unlocked');	
					response.push(senderId);
					if(response.length  === contributors.length) {
						library.config.contributors.users = library.config.contributors.users.concat(library.config.contributors.newUsers);
						library.config.contributors.newUsers = [];
						response = [];
					}
				}).catch(function (err) {		 
					library.logger.error(err.stack);			
				});
			});
		}
	}
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