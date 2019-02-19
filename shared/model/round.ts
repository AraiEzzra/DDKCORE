export type Slots = { [generatorPublicKey: string]: { slot: number } };

export class Round {
    id?: number;
    slots: Slots;
    startHeight?: number;
    endHeight?: number;

    constructor(data: {id: number, slots: Slots}) {
        Object.assign(this, data); // todo workaround
    }
}
