export type Slots = { [generatorPublicKey: string]: { slot: number } };

export class Round {
    slots: Slots;
    startHeight?: number;
    endHeight?: number;

    constructor(data: Round) {
        Object.assign(this, data); // todo workaround
    }
}
