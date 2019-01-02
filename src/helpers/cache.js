let redis = require('redis');
const async = require('async');


/**
 * Connects with redis server using the config provided via parameters
 * @param {Boolean} cacheEnabled
 * @param {Object} config - Redis configuration
 * @param {Object} logger
 * @param {Function} cb
 */
module.exports.connect = function (cacheEnabled, config, logger, cb) {
	let isRedisLoaded = false;

	if (!cacheEnabled) {
		return cb(null, { cacheEnabled: cacheEnabled, client: null });
	}

	// delete password key if it's value is null
	if (config.password === null) {
		delete config.password;
	}
	let client = redis.createClient(config);

	client.on('ready', () => {
		logger.info('App connected with redis server');

		if (!isRedisLoaded) {
			isRedisLoaded = true;
			setDefaultValues(() => {
                return cb(null, { cacheEnabled: cacheEnabled, client: client });
			});
		}
	});
	
	client.get('minedContributorsBoolean', function (err, minedContributorsBoolean) {
		if (!minedContributorsBoolean) {
			client.set('minedContributorsBalance', 0);
			client.set('minedContributorsBoolean', 1);
		}

	});

	client.on('error', function (err) {
		logger.error('Redis:', err);
		// Only throw an error if cache was enabled in config but were unable to load it properly
		if (!isRedisLoaded) {
			isRedisLoaded = true;
			return cb(null, { cacheEnabled: cacheEnabled, client: null });
		}
	});

	const defaultValues = {
        "referStatus": true
	};

	function setDefaultValues(cb) {
        async.eachOfSeries(defaultValues, function(value, key, callback){
            logger.info('key: ' + key + ' value: ' + value);
            client.set(key, JSON.stringify(value), function(err){
            	if (err){
                    logger.warn('Can\'t set redis default variable: ' + key);
				}
				callback();
			});
		}, function(err) {
        	if (err) {
                logger.warn('Redis default variables are not set.');
			} else {
                logger.info('Redis default variables are set successfully.');
			}
            cb();
        });
	}
};

/*************************************** END OF FILE *************************************/
