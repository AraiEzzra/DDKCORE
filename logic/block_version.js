const exceptions = require('../helpers/exceptions.js');
const constants = require('../helpers/constants');

/**
 * Main blockVersion logic
 *
 * @class
 * @memberof logic
 * @see Parent: {@link logic}
 */

/**
 * Current block version.
 *
 * @property {number} currentBlockVersion - Current block version used for forging and verify
 */
const currentBlockVersion = constants.CURRENT_BLOCK_VERSION;

/**
 * Checks if block version is valid - if match current version or there is an exception for provided block height.
 *
 * @param {number} version - Block version
 * @param {number} height - Block height
 * @returns {boolean}
 */
function isValid(version, height) {
    // Check is there an exception for provided height and if yes assing its version
    const exceptionVersion = Object.keys(exceptions.blockVersions).find(
        exceptionVersion => {
            // Get height range of current exceptions
            const heightsRange = exceptions.blockVersions[exceptionVersion];
            // Check if provided height is between the range boundaries
            return height >= heightsRange.start && height <= heightsRange.end;
        }
    );
    if (exceptionVersion === undefined) {
        // If there is no exception for provided height - check against current block version
        return version === this.currentBlockVersion;
    }

    // If there is an exception - check if version match
    return Number(exceptionVersion) === version;
}

module.exports = {
    isValid,
    currentBlockVersion,
};