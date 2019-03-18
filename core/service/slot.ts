import config from 'shared/util/config';
import { SECOND } from 'core/util/const';

type EpochTime = number;
const { SLOT_INTERVAL} = config.constants;

class SlotService {
    /**
     * Gets constant time from ddk epoch.
     * @returns {number} epochTime from constants.
     */
    private beginEpochTime(): Date {
        return new Date(config.constants.epochTime);
    }

    /**
     * Calculates time since ddk epoch.
     * @param {number|undefined} time - Time in unix seconds.
     */
    private getEpochTime(time: number = Date.now()): EpochTime {
        const d = this.beginEpochTime();
        const t = d.getTime();

        return Math.floor((time - t) / SECOND);
    }

    /**
     * @method
     * @param {number} time
     * @return {number} ddk epoch time constant.
     */
    public getTime(time?: number): EpochTime {
        return this.getEpochTime(time);
    }

    /**
     * @method
     * @param {number} [epochTime]
     * @return {number} constant time from ddk epoch + input time.
     */
    public getRealTime(epochTime: EpochTime = this.getTime()): number {
        const d = this.beginEpochTime();
        const t = Math.floor(d.getTime() / SECOND) * SECOND;

        return t + epochTime * SECOND;
    }

    /**
     * @method
     * @param {number} [epochTime] - time or
     * @return {number} input time / slot interval.
     */
    public getSlotNumber(epochTime: EpochTime = this.getTime()): number {
        return Math.floor(epochTime / SLOT_INTERVAL);
    }

    /**
     * @method
     * @param {number} slot - slot number
     * @return {number} input slot * slot interval.
     */
    public getSlotTime(slot: number): EpochTime {
        return slot * SLOT_INTERVAL;
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
        return nextSlot + config.constants.activeDelegates;
    }

    public roundTime(date: Date): number {
        return Math.floor(date.getTime() / SECOND) * SECOND;
    }

    public getTheFirsSlot() {
        return Math.floor(this.getSlotNumber() / config.constants.activeDelegates) * config.constants.activeDelegates;
    }

    public getSlotRealTime(slot: number): number {
        const slotTime = this.getSlotTime(slot);
        return this.getRealTime(slotTime);
    }
}

export default new SlotService();
