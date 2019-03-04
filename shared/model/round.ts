export type Slots = { [generatorPublicKey: string]: { slot: number } };

export class RoundModel {
    slots: Slots;
    startHeight?: number;
    endHeight?: number;

    constructor(data: RoundModel) {
        Object.assign(this, data); // todo workaround
    }
}

export class Round extends RoundModel {

    getCopy(): Round {
        return new Round(this);
    }

}
