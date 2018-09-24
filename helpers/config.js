let fs = require('fs');
let path = require('path');
let z_schema = require('./z_schema.js');
let configSchema = require('../schema/config.js');
let constants = require('../helpers/constants.js');
let env = process.env;
let configData = {};

/**
 * Loads config.json file
 * @memberof module:helpers
 * @implements {validateForce}
 * @param {string} configPath 
 * @returns {Object} configData
 */
function Config (configPath) {

	// For development mode
	if(env.NODE_ENV === 'development') {
		configData = require('../config/default');
		//configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/default.js')), 'utf8');
	}

	// For staging environment
	if(env.NODE_ENV === 'testnet') {
		configData = require('../config/testnet');
		//configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/testnet.js')), 'utf8');
	}

	// For production 
	if(env.NODE_ENV === 'mainnet') {
		configData = require('../config/mainnet');
		//configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/mainnet.js')), 'utf8');
	}
	console.log("DDK-Config-Check : " + JSON.stringify(configData));

	/* if (!configData.length) {
		console.log('Failed to read config file');
		process.exit(1);
	} else {
		configData = configData;
	} */

	let validator = new z_schema();
	let valid = validator.validate(configData, configSchema.config);

	if (!valid) {
		console.log('Failed to validate config data', validator.getLastErrors());
		process.exit(1);
	} else {
		validateForce(configData);
		return configData;
	}
}

/**
 * Validates nethash value from constants and sets forging force to false if any.
 * @private
 * @param {Object} configData 
 */
function validateForce (configData) {
	if (configData.forging.force) {
		let index = constants.nethashes.indexOf(configData.nethash);

		if (index !== -1) {
			configData.forging.force = false;
		}
	}
}

// Exports
module.exports = Config;

/*************************************** END OF FILE *************************************/
