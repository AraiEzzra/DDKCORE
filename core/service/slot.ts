import * as crypto from 'crypto';
import config from 'shared/config';
import { SECOND } from 'core/util/const';
import { Delegate } from 'shared/model/delegate';
import { Timestamp } from 'shared/model/account';
import { Slot, Slots } from 'shared/model/round';
import { sortHashListFunc } from 'core/util/slot';

type EpochTime = number;

class SlotService {
    /**
     * Gets constant time from ddk epoch.
     * @returns {number} epochTime from constants.
     */
    private beginEpochTime(): Date {
        return new Date(config.CONSTANTS.EPOCH_TIME);
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
        return this.beginEpochTime().getTime() + epochTime * SECOND;
    }

    /**
     * @method
     * @param {number} [epochTime] - time or
     * @return {number} input time / slot interval.
     */
    public getSlotNumber(epochTime: EpochTime = this.getTime()): number {
        return Math.floor(epochTime / config.CONSTANTS.FORGING.SLOT_INTERVAL);
    }

    /**
     * @method
     * @param {number} slot - slot number
     * @return {number} input slot * slot interval.
     */
    public getSlotTime(slot: number): EpochTime {
        return slot * config.CONSTANTS.FORGING.SLOT_INTERVAL;
    }

    public getSlotRealTime(slot: number): number {
        const slotTime = slot * config.CONSTANTS.FORGING.SLOT_INTERVAL;
        return this.getRealTime(slotTime);
    }

    public generateSlots(blockId: string, delegates: Array<Delegate>, firstSlotNumber: number): Slots {
        const hashedDelegates = delegates.map((delegate: Delegate) => {
            const { publicKey } = delegate.account;
            const hash = crypto.createHash('md5').update(publicKey + blockId).digest('hex');
            return {
                hash,
                generatorPublicKey: publicKey
            };
        });
        const sortedDelegates = hashedDelegates.sort(sortHashListFunc);
        const slots: Slots = {};
        sortedDelegates.forEach((delegate, index) => {
            slots[delegate.generatorPublicKey] = new Slot(firstSlotNumber + index);
        });
        return slots;
    }

    public getTruncTime(): Timestamp {
        return Math.floor(this.getTime() / config.CONSTANTS.FORGING.SLOT_INTERVAL) *
            config.CONSTANTS.FORGING.SLOT_INTERVAL;
    }
}

export default new SlotService();
