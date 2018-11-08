

let Router = require('../../helpers/router');
let httpApi = require('../../helpers/httpApi');
let schema = require('../../schema/accounts.js');
let tokenValidator = require('../../tokenValidator');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/accounts`
 * - Public API:
	- post /open
	- get /getBalance
	- get /getPublicKey
	- post /generatePublicKey
	- get /delegates
	- get /delegates/fee
	- put /delegates
	- get /
	- get /count
	- get /getCirculatingSupply
	- get /totalSupply
	- post /migrateData 
	- post /existingETPSUser/validate
	- post /verifyUserToComment
 * - Private API:
 * 	- get /count
	- get /lock
	- get /unlock
	- post /logout
	- post /generateQRCode
	- post /verifyOTP
	- post /enableTwoFactor
	- post /disableTwoFactor
	- get /checkTwoFactorStatus
	- get /getWithdrawlStatus
	- post /sendWithdrawlAmount
	- post /enablePendingGroupBonus
 * @memberof module:accounts
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} accountsModule - Module account instance.
 * @param {scope} app - Network app.
 * @param config appConfig
 */

function AccountsHttpApi (accountsModule, app, logger, cache, config) {

	let router = new Router();

	router.map(accountsModule.shared, {
		'post /open': 'open',
		'get /getBalance': 'getBalance',
		'get /getPublicKey': 'getPublickey',
		'post /generatePublicKey': 'generatePublicKey',
		'get /delegates': 'getDelegates',
		'get /delegates/fee': 'getDelegatesFee',
		'put /delegates': 'addDelegates',
		'get /': 'getAccount',
		'get /count':'totalAccounts',
		'get /getCirculatingSupply':'getCirculatingSupply',
		'get /totalSupply' : 'totalSupply',
		'post /migrateData' : 'migrateData', 
		'post /existingETPSUser/validate' : 'validateExistingUser',
		'post /verifyUserToComment': 'verifyUserToComment',
		'post /senderBalance': 'senderAccountBalance',
		'post /getMigratedUsers': 'getMigratedUsersList'
	});

	router.map(accountsModule.internal, {
		'get /count': 'count',
		'get /lock': 'lockAccount',
		'get /unlock': 'unlockAccount',
		'post /logout': 'logout',
		'post /generateQRCode': 'generateQRCode',
		'post /verifyOTP': 'verifyOTP',
		'post /enableTwoFactor': 'enableTwoFactor',
		'post /disableTwoFactor': 'disableTwoFactor',
		'get /checkTwoFactorStatus': 'checkTwoFactorStatus',
		'get /getWithdrawlStatus': 'getWithdrawlStatus',
		'post /sendWithdrawlAmount': 'sendWithdrawlAmount',
		'post /enablePendingGroupBonus': 'enablePendingGroupBonus',
		'get /generatenpNewPassphase':'generatenpNewPassphase',
		'post /forgotEtpsPassword': 'forgotEtpsPassword'
	});
	if (config.debug) {
		router.map(accountsModule.internal, {'get /getAllAccounts': 'getAllAccounts'});
	}

	if (config.topAccounts) {
		router.get('/top', httpApi.middleware.sanitize('query', schema.top, accountsModule.internal.top));
	}
	app.use('/api/accounts/getBalance', (req, res, next) => tokenValidator(req, res, next, config.jwt.secret));
	app.use('/api/accounts/logout', (req, res, next) => tokenValidator(req, res, next, config.jwt.secret));
	httpApi.registerEndpoint('/api/accounts', app, router, accountsModule.isLoaded);
}

module.exports = AccountsHttpApi;

/*************************************** END OF FILE *************************************/
