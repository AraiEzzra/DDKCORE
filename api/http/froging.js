

let Router = require('../../helpers/router');
let httpApi = require('../../helpers/httpApi');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/froging`
 * - Public API:
	- post /freeze
	- get /count
	- post /getAllOrders
	- post /getAllActiveOrders
	- post /getMyDDKFrozen
 * @memberof module:frogings
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} frogingsModule - Module transaction instance.
 * @param {scope} app - Network app.
 */
// Constructor
function FrogingsHttpApi (frogingsModule, app, logger, cache) {
	let router = new Router();

	// attach a middlware to endpoints
	router.attachMiddlwareForUrls(httpApi.middleware.useCache.bind(null, logger, cache), [
		'get /'
	]);

	router.map(frogingsModule.shared, {
		
		'post /freeze' : 'addTransactionForFreeze',
		'get /count': 'getFrozensCount',
		'post /getAllOrders' : 'getAllFreezeOrders',
		'post /getAllActiveOrders' : 'getAllActiveFreezeOrders',
		'post /getMyDDKFrozen' : 'getMyDDKFrozen'
	});

	httpApi.registerEndpoint('/api/frogings', app, router, frogingsModule.isLoaded);
}

module.exports = FrogingsHttpApi;

/*************************************** END OF FILE *************************************/
