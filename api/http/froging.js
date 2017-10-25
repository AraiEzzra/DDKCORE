'use strict';

var Router = require('../../helpers/router');
var httpApi = require('../../helpers/httpApi');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/froging`
 * - Public API:
 * @memberof module:frogings
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} frogingsModule - Module transaction instance.
 * @param {scope} app - Network app.
 */
// Constructor
function FrogingsHttpApi (frogingsModule, app, logger, cache) {
	var router = new Router();

	// attach a middlware to endpoints
	router.attachMiddlwareForUrls(httpApi.middleware.useCache.bind(null, logger, cache), [
		'get /'
	]);

	//Hotam Singh
	router.map(frogingsModule.shared, {
		
		'post /freeze' : 'addTransactionForFreeze',
		'get /count': 'getFrozensCount'
	});

	httpApi.registerEndpoint('/api/frogings', app, router, frogingsModule.isLoaded);
}

module.exports = FrogingsHttpApi;
