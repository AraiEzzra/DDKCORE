

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
	- get /totalSupply
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
 */

function AccountsHttpApi (accountsModule, app) {

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
		'get /totalSupply' : 'totalSupply',
		'post /existingETPSUser/validate' : 'validateExistingUser',
		'post /verifyUserToComment': 'verifyUserToComment',
		'post /senderBalance': 'senderAccountBalance',
		'post /getMigratedUsers': 'getMigratedUsersList',
		'get /getDashboardDDKData': 'getDashboardDDKData',
		'post /updateEtpsInfo': 'updateEtpsUser'

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
		'post /forgotEtpsPassword': 'forgotEtpsPassword',
		'put /enableLogin': 'enableLogin',
		'put /disableLogin': 'disableLogin'
	});

	if (process.env.DEBUG && process.env.DEBUG.toUpperCase() === 'TRUE') {
		router.map(accountsModule.internal, {'get /getAllAccounts': 'getAllAccounts'});
	}

	if (process.env.TOP && process.env.TOP.toUpperCase() === 'TRUE') {
		router.get('/top', httpApi.middleware.sanitize('query', schema.top, accountsModule.internal.top));
	}
	app.use('/api/accounts/getBalance', tokenValidator);
	app.use('/api/accounts/logout', tokenValidator);
	httpApi.registerEndpoint('/api/accounts', app, router, accountsModule.isLoaded);
}

module.exports = AccountsHttpApi;

/*************************************** END OF FILE *************************************/
