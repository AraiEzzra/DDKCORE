
let httpApi = require('./httpApi');
let extend = require('extend');
let utils = require('../utils.js');

/**
 * Express.js router wrapper.
 * @memberof module:helpers
 * @function
 * @returns {Object} router express
 * @throws {Error} If config is invalid
 */
let Router = function () {
	let router = require('express').Router();

	router.use(httpApi.middleware.cors);

	router.map = function (root, config) {
		let router = this;

		Object.keys(config).forEach(function (params) {
			let route = params.split(' ');
			if (route.length !== 2 || ['post', 'get', 'put'].indexOf(route[0]) === -1) {
				throw Error('Invalid map config');
			}
			// made changes to add session data and res object to the req object that is accessible in modules
			router[route[0]](route[1], utils.validateClient, function (req, res, next) {
				let reqRelevantInfo = {
					ip: req.ip,
					host: req.get('host'),
					protocol: req.protocol,
					method: req.method,
					path: req.path,
					decoded: req.decoded
				};
				root[config[params]](extend({}, reqRelevantInfo, res, {'body': route[0] === 'get' ? req.query : req.body}), httpApi.respond.bind(null, res));
			});
		});
	};
	/**
	 * Adds one middleware to an array of routes.
	 * @param {Function} middleware
	 * @param {String} routes
	 */
	router.attachMiddlwareForUrls = function (middleware, routes) {
		routes.forEach(function (entry) {
			let route = entry.split(' ');

			if (route.length !== 2 || ['post', 'get', 'put'].indexOf(route[0]) === -1) {
				throw Error('Invalid map config');
			}
			router[route[0]](route[1], middleware);
		});
	};

	return router;

};

module.exports = Router;
