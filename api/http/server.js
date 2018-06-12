

var Router = require('../../helpers/router');
var Accounts = require('../../modules/accounts');
var tokenValidator = require('../../tokenValidator');
var config = require('../../config');
var jwt = require('jsonwebtoken');
var jwtSecret = process.env.JWT_SECRET;

/**
 * Renders main page wallet from public folder.
 * - Public API:
 * 	- get	/
 * @memberof module:server
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} serverModule - Module server instance.
 * @param {scope} app - Main app.
 */
// Constructor
function ServerHttpApi (serverModule, app) {

	var router = new Router();

	router.use(function (req, res, next) {
		if (serverModule.areModulesReady()) { return next(); }
		res.status(500).send({success: false, error: 'Blockchain is loading'});
	});

	//get user's status
	router.get('/user/status', tokenValidator, function(req, res) {
		if(req.decoded.address) {
			Accounts.prototype.getAccount({address: req.decoded.address}, function(err, account) {
				if (!err) {
					var payload = {
						secret: req.decoded.secret,
						address: req.decoded.address
					};
					var refreshToken = jwt.sign(payload, jwtSecret, {
						expiresIn: config.jwt.tokenLife,
						mutatePayload: false
					});

					return res.status(200).json({
						status: true,
						data: {
							success: true,
							account: account,
							refreshToken: refreshToken || ''
						}
					});
				}
			});
		}else {
			return res.status(200).json({
				status: false
			});
		}
	});  

	router.get('/', function (req, res) {
		if (serverModule.isLoaded()) {
			res.render('wallet.html', { layout: false });
		} else {
			res.render('loading.html');
		}
	});

	router.use(function (req, res, next) {
		if (req.url.indexOf('/api/') === -1 && req.url.indexOf('/peer/') === -1) {
			return res.redirect('/');
		}
		next();
	});

	app.use('/', router);
}

module.exports = ServerHttpApi;
