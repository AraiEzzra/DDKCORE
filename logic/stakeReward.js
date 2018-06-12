

var constants = require('../helpers/constants.js');

// Private fields
var __private = {};

/**
 * Initializes variables:
 * - milestones
 * - distance
 * @memberof module:blocks
 * @class
 * @classdesc Main StakeReward logic.
 */
// Constructor
function StakeReward () {
	// Array of milestones
	this.milestones = constants.froze.rewards.milestones;

	// Distance between each milestone
	this.distance = Math.floor(constants.froze.rewards.distance);
}

// Private methods
/**
 * Returns absolute value from number.
 * @private
 * @param {number} height
 * @return {number}
 * @throws Invalid block height
 */
__private.parseHeight = function (height) {
	if (isNaN(height)) {
		throw 'Invalid block height';
	} else {
		return Math.abs(height);
	}
};

// Public methods
/**
 * @implements {__private.parseHeight}
 * @param {number} height
 * @return {number}
 */
StakeReward.prototype.calcMilestone = function (height) {
//	height = __private.parseHeight(height);

	var location = Math.trunc((height ) / this.distance);
	var lastMile = this.milestones[this.milestones.length - 1];

	if (location > (this.milestones.length - 1)) {
		return this.milestones.lastIndexOf(lastMile);
	} else {
		return location;
	}
};

/**
 * @implements {__private.parseHeight}
 * @implements {StakeReward.calcMilestone}
 * @param {number} height
 * @return {number}
 */
StakeReward.prototype.calcReward = function (height) {
	height = __private.parseHeight(height);

	return this.milestones[this.calcMilestone(height)];
	
};

// Export
module.exports = StakeReward;
