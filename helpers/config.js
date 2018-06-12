

let fs = require('fs');
let path = require('path');
let z_schema = require('./z_schema.js');
let configSchema = require('../schema/config.js');
let constants = require('../helpers/constants.js');

/**
 * Loads config.json file
 * @memberof module:helpers
 * @implements {validateForce}
 * @param {string} configPath 
 * @returns {Object} configData
 */
function Config (configPath) {
	let configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config.json')), 'utf8');

	if (!configData.length) {
		console.log('Failed to read config file');
		process.exit(1);
	} else {
		configData = JSON.parse(configData);
	}

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
