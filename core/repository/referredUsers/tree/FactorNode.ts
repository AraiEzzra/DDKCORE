import config from 'shared/config/index';
import { Node } from 'core/util/tree';
import { FactorType, Factors } from 'core/repository/referredUsers/interfaces';

export default class FactorNode<T> extends Node<T> {

    levelSummary: Array<Factors>;

    constructor(data: T) {
        super(data);

        this.levelSummary = new Array(config.CONSTANTS.REFERRAL.MAX_COUNT);

        for (let i = 0; i < config.CONSTANTS.REFERRAL.MAX_COUNT; i++) {
            this.levelSummary[i] = this.getEmptyFactor();
        }
    }

    getEmptyFactor(): Factors {
        return new Map([
            [FactorType.COUNT, 0],
            [FactorType.REWARD, 0],
            [FactorType.STAKE_AMOUNT, 0]
        ]);
    }

    getFactorsByLevel(level: number): Factors {
        if (level < 0 || level > config.CONSTANTS.REFERRAL.MAX_COUNT) {
            return this.getEmptyFactor();
        }
        return this.levelSummary[level];
    }

    addFactor(type: FactorType, level: number, value: number) {
        for (let i = 0; i < level; i++) {
            const factor = this.levelSummary[i];
            factor.set(type, factor.get(type) + value);
        }
    }
}
