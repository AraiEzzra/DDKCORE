import { SerializedDelegate } from 'shared/model/delegate';

export class Slot {
    slot: number;
    isForged: boolean;

    constructor(slot: number) {
        this.slot = slot;
        this.isForged = false;
    }
}

export type Slots = { [generatorPublicKey: string]: Slot };

export class RoundModel {
    slots: Slots;
    startHeight?: number;
    endHeight?: number;

    // TODO: for debugger
    lastBlockId?: string;

    constructor(data: RoundModel) {
        Object.assign(this, data); // todo workaround
    }
}

export type SerializedRound = Array<{
    slotNumber: number,
    delegate: SerializedDelegate,
}>;

export class Round extends RoundModel {
    getCopy(): Round {
        return new Round(this);
    }
}
