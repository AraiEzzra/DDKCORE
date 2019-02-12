const constants = { // todo config!
    epochTime: new Date(Date.UTC(2016, 0, 1, 17, 0, 0, 0)),
    activeDelegates: 11
};

class SlotService {
    /**
     * @property {number} interval - Slot time interval in seconds.
     */
    private interval: number = 10;

    /**
     * Gets constant time from ddk epoch.
     * @returns {number} epochTime from constants.
     */
    private beginEpochTime(): Date {
        return constants.epochTime;
    }

    /**
     * Calculates time since ddk epoch.
     * @param {number|undefined} time - Time in unix seconds.
     */
    private getEpochTime(time: number = Date.now()): number {
        const d = this.beginEpochTime();
        const t = d.getTime();

        return Math.floor((time - t) / 1000);
    }

    /**
     * @method
     * @param {number} time
     * @return {number} ddk epoch time constant.
     */
    public getTime(time?: number): number {
        return this.getEpochTime(time);
    }

    /**
     * @method
     * @param {number} [epochTime]
     * @return {number} constant time from ddk epoch + input time.
     */
    public getRealTime(epochTime: number = this.getTime()): number {
        const d = this.beginEpochTime();
        const t = Math.floor(d.getTime() / 1000) * 1000;

        return t + epochTime * 1000;
    }

    /**
     * @method
     * @param {number} [epochTime] - time or
     * @return {number} input time / slot interval.
     */
    public getSlotNumber(epochTime: number = this.getTime()): number {
        return Math.floor(epochTime / this.interval);
    }

    /**
     * @method
     * @param {number} slot - slot number
     * @return {number} input slot * slot interval.
     */
    public getSlotTime(slot: number): number {
        return slot * this.interval;
    }

    /**
     * @method
     * @return {number} current slot number + 1.
     */
    public getNextSlot(): number {
        const slot = this.getSlotNumber();

        return slot + 1;
    }

    /**
     * @method
     * @param {number} nextSlot
     * @return {number} input next slot + delegates.
     * // todo mb drop it ?
     */
    public getLastSlot(nextSlot: number): number {
        return nextSlot + constants.activeDelegates;
    }

    public roundTime(date: Date): number {
        return Math.floor(date.getTime() / 1000) * 1000;
    }
}

export default new SlotService();
