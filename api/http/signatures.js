

let Router = require('../../helpers/router');
let httpApi = require('../../helpers/httpApi');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/signatures`
 * - Public API:
 * 	- get	/fee
 * 	- put	/
 * @memberof module:signatures
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} signaturesModule - Module signatures instance.
 * @param {scope} app - Network app.
 */
// Constructor
function SignaturesHttpApi (signaturesModule, app) {

	let router = new Router();

	router.map(signaturesModule.shared, {
		'get /fee': 'getFee',
		'put /': 'addSignature'
	});

	httpApi.registerEndpoint('/api/signatures', app, router, signaturesModule.isLoaded);
}

module.exports = SignaturesHttpApi;

/*************************************** END OF FILE *************************************/
