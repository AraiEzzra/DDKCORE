

let Router = require('../../helpers/router');
let httpApi = require('../../helpers/httpApi');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/shiftOrder`
 * - Public API:
 *  - post /sendFreezeOrder
 * @memberof module:frogings
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} frogingsModule - Module transaction instance.
 * @param {scope} app - Network app.
 */
// Constructor
function sendFreezeOrderHttpApi (sendFreezeOrderModule, app, logger, cache) {
	let router = new Router();

	// attach a middlware to endpoints
	router.attachMiddlwareForUrls(httpApi.middleware.useCache.bind(null, logger, cache), [
		'get /'
	]);

	router.map(sendFreezeOrderModule.shared, {
		
		'post /sendFreezeOrder' : 'transferFreezeOrder',		
	});

	httpApi.registerEndpoint('/api/shiftOrder', app, router, sendFreezeOrderModule.isLoaded);
}

module.exports = sendFreezeOrderHttpApi;
