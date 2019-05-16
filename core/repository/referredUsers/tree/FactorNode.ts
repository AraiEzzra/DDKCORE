import config from 'shared/config/index';
import { Node } from 'core/util/tree';
import { FactorType, ReferredUserFactor, FactorAction } from 'core/repository/referredUsers/interfaces';

export default class FactorNode<T> extends Node<T> {

    private readonly levelSummary: Array<ReferredUserFactor>;

    constructor(data: T) {
        super(data);

        this.levelSummary = new Array(config.CONSTANTS.REFERRAL.MAX_COUNT);

        for (let i = 0; i < config.CONSTANTS.REFERRAL.MAX_COUNT; i++) {
            this.levelSummary[i] = ReferredUserFactor.createEmpty();
        }
    }

    private idLevelValid(level: number): boolean {
        return level >= 0 && level < config.CONSTANTS.REFERRAL.MAX_COUNT;
    }

    getFactorsByLevel(level: number): ReferredUserFactor {
        if (this.idLevelValid(level)) {
            return this.levelSummary[level];
        }
        return ReferredUserFactor.createEmpty();
    }

    addFactor(type: FactorType, level: number, value: number, action: FactorAction) {
        for (let i = 0; i < level; i++) {
            const factor = this.levelSummary[i];
            factor.update(type, value, action);
        }
    }
}
