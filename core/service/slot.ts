const constants = { // todo config!
    epochTime: new Date(Date.UTC(2016, 0, 1, 17, 0, 0, 0)),
    activeDelegates: 11
};

export class SlotService {
    private static instance: SlotService = undefined;

    /**
     * @property {number} interval - Slot time interval in seconds.
     */
    public interval: number = 10;

    /**
     * @property {number} delegates - Active delegates from constants.
     */
    public delegates: number = constants.activeDelegates;

    constructor() {
        if (!SlotService.instance) {
            SlotService.instance = this;

        }
        return SlotService.instance;
    }

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
     */
    public getLastSlot(nextSlot: number): number {
        return nextSlot + this.delegates;
    }

    public roundTime(date: Date): number {
        return Math.floor(date.getTime() / 1000) * 1000;
    }

    /**
     * Calculates round number from the given height.
     * @param {number} height - Height from which round is calculated
     * @returns {number} Round number
     */
    public calcRound(height: number): number {
        return Math.ceil(height / constants.activeDelegates);
    }
}
