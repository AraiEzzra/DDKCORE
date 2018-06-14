

let constants = require('../helpers/constants.js');

// Private fields
let __private = {};

/**
 * Initializes variables:
 * - milestones
 * - distance
 * - rewardOffset
 * @memberof module:blocks
 * @class
 * @classdesc Main BlockReward logic.
 */
// Constructor
function BlockReward () {
	// Array of milestones
	this.milestones = constants.rewards.milestones;

	// Distance between each milestone
	this.distance = Math.floor(constants.rewards.distance);

	// Start rewards at block (n)
	this.rewardOffset = Math.floor(constants.rewards.offset);
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
BlockReward.prototype.calcMilestone = function (height) {
	height = __private.parseHeight(height);

	let location = Math.trunc((height - this.rewardOffset) / this.distance);
	let lastMile = this.milestones[this.milestones.length - 1];

	if (location > (this.milestones.length - 1)) {
		return this.milestones.lastIndexOf(lastMile);
	} else {
		return location;
	}
};

/**
 * @implements {__private.parseHeight}
 * @implements {BlockReward.calcMilestone}
 * @param {number} height
 * @return {number}
 */
BlockReward.prototype.calcReward = function (height) {
	height = __private.parseHeight(height);

	if (height < this.rewardOffset) {
		return 0;
	} else {
		return this.milestones[this.calcMilestone(height)];
	}
};

/**
 * @implements {__private.parseHeight}
 * @implements {BlockReward.calcMilestone}
 * @param {number} height
 * @return {number}
 */
BlockReward.prototype.calcSupply = function (height) {
	height = __private.parseHeight(height);

	if (height < this.rewardOffset) {
		// Rewards not started yet
		return constants.totalAmount;
	}

	let milestone = this.calcMilestone(height);
	let supply    = constants.totalAmount;
	let rewards   = [];

	let amount = 0, multiplier = 0;

	// Remove offset from height
	height -= this.rewardOffset - 1;

	for (let i = 0; i < this.milestones.length; i++) {
		if (milestone >= i) {
			multiplier = this.milestones[i];

			if (height < this.distance) {
				// Measure this.distance thus far
				amount = height % this.distance;
			} else {
				amount = this.distance; // Assign completed milestone
				height -= this.distance; // Deduct from total height

				// After last milestone
				if (height > 0 && i === this.milestones.length - 1) {
					amount += height;
				}
			}

			rewards.push([amount, multiplier]);
		} else {
			break; // Milestone out of bounds
		}
	}

	for (let i = 0; i < rewards.length; i++) {
		let reward = rewards[i];
		supply += reward[0] * reward[1];
	}

	return supply;
};

// Export
module.exports = BlockReward;
