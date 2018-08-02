

//Requiring Modules 
let Contract = require('../logic/contract.js');
let transactionTypes = require('../helpers/transactionTypes.js');

//Private Fields
let __private = {}, self = null,
	library = null, modules = null;
__private.assetTypes = {};

/**
 * Initializes library with scope content and generates a Contract instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:contracts
 * @class
 * @classdesc Main contracts methods.
 * @implements module:contracts.Contract#Contract
  * @param {scope} scope - App instance.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} With `this` as data.
 */
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
		transactionTypes.CONTRACT, new Contract(scope.config, scope.db)
	);

	setImmediate(cb, null, self);
}

/**
 * on bind called when modules are ready and launched.
 * attach required modules to be used.
  * @param {scope} scope - App instance.
 */
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
};

module.exports = Contracts;

/*************************************** END OF FILE *************************************/
