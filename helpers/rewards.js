'use strict';

/**
 * @author - Satish Joshi
 * @param stakeReward - Direct Introducer referral reward percentage.
 * @param level - Chain referral reward percentage upto level 15.
 */

const Rewards = {
    stakeReward: 10,
    level: [5, 3, 2, 2, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.5]
}

module.exports = Rewards;