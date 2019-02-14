export type Slots = { [generatorPublicKey: string]: { slot: number } };

class Round {
    id: number;
    slots: Slots;
}
