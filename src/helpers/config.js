const fs = require('fs');
const path = require('path');
const z_schema = require('./z_schema.js');
const configSchema = require('../schema/config.js');
const constants = require('./constants.js');

const env = process.env;
let configData = {};

/**
 * Loads config.json file
 * @memberof module:helpers
 * @implements {validateForce}
 * @param {string} configPath
 * @returns {Object} configData
 */
function Config(configPath) {
    // For development mode
    if (env.NODE_ENV_IN === 'development') {
        configData = require('../config/default/config');
        // configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/default.js')), 'utf8');
    }

    // For staging environment
    if (env.NODE_ENV_IN === 'testnet') {
        configData = require('../config/testnet/config');
        // configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/testnet.js')), 'utf8');
    }

    // For production
    if (env.NODE_ENV_IN === 'mainnet') {
        configData = require('../config/mainnet/config');
        // configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/mainnet.js')), 'utf8');
    }

    if (env.NODE_ENV_IN === 'test') {
        configData = { coverage: true };
        // configData = fs.readFileSync(path.resolve(process.cwd(), (configPath || 'config/mainnet.js')), 'utf8');
    }

    /* if (!configData.length) {
     console.log('Failed to read config file');
     process.exit(1);
     } else {
     configData = configData;
     } */

    const validator = new z_schema();
    const valid = validator.validate(configData, configSchema.config);

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
function validateForce(configData) {
    if (configData.forging.force) {
        const index = constants.nethashes.indexOf(configData.nethash);

        if (index !== -1) {
            configData.forging.force = false;
        }
    }
}

// Exports
module.exports = Config;

/** ************************************* END OF FILE ************************************ */
