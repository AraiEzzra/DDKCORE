const constants = require('./constants.js');

/**
 * @memberof module:helpers
 * @module helpers/slots
 */
/**
 * Gets constant time from ddk epoch.
 * @returns {number} epochTime from constants.
 */
function beginEpochTime() {
    const d = constants.epochTime;

    return d;
}

/**
 * Calculates time since ddk epoch.
 * @param {number|undefined} time - Time in unix seconds.
 * @returns {number} current time - ddk epoch time.
 */
function getEpochTime(time) {
    if (time === undefined) {
        time = Date.now();
    }

    const d = beginEpochTime();
    const t = d.getTime();

    return Math.floor((time - t) / 1000);
}
/**
 * @namespace
 */
module.exports = {
    /**
     * @property {number} interval - Slot time interval in seconds.
     */
    interval: 10,

    /**
     * @property {number} delegates - Active delegates from constants.
     */
    delegates: constants.activeDelegates,

    /**
     * @method
     * @param {number} time
     * @return {number} ddk epoch time constant.
     */
    getTime(time) {
        return getEpochTime(time);
    },

    /**
     * @method
     * @param {number} [epochTime]
     * @return {number} constant time from ddk epoch + input time.
     */
    getRealTime(epochTime) {
        if (epochTime === undefined) {
            epochTime = this.getTime();
        }

        const d = beginEpochTime();
        const t = Math.floor(d.getTime() / 1000) * 1000;

        return t + epochTime * 1000;
    },

    /**
     * @method
     * @param {number} [epochTime] - time or
     * @return {number} input time / slot interval.
     */
    getSlotNumber(epochTime) {
        if (epochTime === undefined) {
            epochTime = this.getTime();
        }

        return Math.floor(epochTime / this.interval);
    },

    /**
     * @method
     * @param {number} slot - slot number
     * @return {number} input slot * slot interval.
     */
    getSlotTime(slot) {
        return slot * this.interval;
    },

    /**
     * @method
     * @return {number} current slot number + 1.
     */
    getNextSlot() {
        const slot = this.getSlotNumber();

        return slot + 1;
    },

    /**
     * @method
     * @param {number} nextSlot
     * @return {number} input next slot + delegates.
     */
    getLastSlot(nextSlot) {
        return nextSlot + this.delegates;
    },

    roundTime(date) {
        return Math.floor(date.getTime() / 1000) * 1000;
    },

    /**
     * Calculates round number from the given height.
     *
     * @param {number} height - Height from which round is calculated
     * @returns {number} Round number
     * @todo Add description for the params
     *
     */
    calcRound(height) {
        return Math.ceil(height / constants.activeDelegates);
    },
};

/** ************************************* END OF FILE ************************************ */
