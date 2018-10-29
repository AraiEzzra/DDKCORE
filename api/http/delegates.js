

let Router = require('../../helpers/router');
let httpApi = require('../../helpers/httpApi');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/delegates`
 * - Public API:
	- get 	/count
	- get 	/search
	- get 	/voters
	- get 	/get
	- get 	/
	- get 	/fee
	- get 	/forging/getForgedByAccount
	- put	/
	- get	/getNextForgers
 * - Private API:
  	- post 	/forging/enable
  	- post 	/forging/disable
  	- get 	/forging/status
  	- get /getLatestVoters
 	- get /getLatestDelegates
 * - Debug API:
 * 	- get	/forging/disableAll
 * 	- get	/forging/enableAll
 * @memberof module:delegates
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} delegatesModule - Module delegate instance.
 * @param {scope} app - Network app.
 * @param config appConfig
 */
// Constructor
function DelegatesHttpApi (delegatesModule, app, logger, cache, config) {

	let router = new Router();

	// attach a middlware to endpoints
	router.attachMiddlwareForUrls(httpApi.middleware.useCache.bind(null, logger, cache), ['get /']);

	router.map(delegatesModule.shared, {
		'get /count': 'count',
		'get /search': 'search',
		'get /voters': 'getVoters',
		'get /get': 'getDelegate',
		'get /': 'getDelegates',
		'get /fee': 'getFee',
		'get /forging/getForgedByAccount': 'getForgedByAccount',
		'put /': 'addDelegate',
		'get /getNextForgers': 'getNextForgers'
	});

	router.map(delegatesModule.internal, {
		'post /forging/enable': 'forgingEnable',
		'post /forging/disable': 'forgingDisable',
		'get /forging/status': 'forgingStatus',
		'get /getLatestVoters': 'getLatestVoters',
		'get /getLatestDelegates': 'getLatestDelegates'
	});

	if (config.debug) {
		router.map(delegatesModule.internal, {
			'get /forging/disableAll': 'forgingDisableAll',
			'get /forging/enableAll': 'forgingEnableAll'
		});
	}

	httpApi.registerEndpoint('/api/delegates', app, router, delegatesModule.isLoaded);
}

module.exports = DelegatesHttpApi;

/*************************************** END OF FILE *************************************/
