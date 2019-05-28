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
    lastBlockId: string;

    constructor(data: RoundModel) {
        Object.assign(this, data); // todo workaround
    }
}

export class Round extends RoundModel {

    getCopy(): Round {
        return new Round(this);
    }

}
