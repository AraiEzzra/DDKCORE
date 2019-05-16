import { Account} from 'shared/model/account';
import { Address } from 'shared/model/types';

export interface IReferredUsers {
    add(account: Account): void;
    delete(account: Account): void;
    getUsers(account: Account, level: number): Array<IReferredUser>;
    updateCountFactor(account: Account, count: number): void;
    updateRewardFactor(account: Account, sponsors: Map<Address, number>): void;
}

export interface IReferredUser {
    address: Address;
    isEmpty: boolean;
    factors: ReferredUserFactor;
}

export enum FactorType {
    COUNT,
    REWARD,
    STAKE_AMOUNT
}

export enum FactorAction {
    ADD = 1,
    SUBTRACT = -1
}

export class ReferredUserFactor {

    static TYPE = FactorType;

    static ACTION = FactorAction;

    static COUNT: number = 3;

    static createEmpty(): ReferredUserFactor {
        return new ReferredUserFactor();
    }

    private readonly items: Array<number>;

    constructor() {
        this.items = new Array(ReferredUserFactor.COUNT);

        this.items[FactorType.COUNT] = 0;
        this.items[FactorType.REWARD] = 0;
        this.items[FactorType.STAKE_AMOUNT] = 0;
    }

    update(factor: FactorType, value: number, action: FactorAction = FactorAction.ADD): void {
        this.items[factor] += action * value;
    }

    getItem(factor: FactorType): number {
        return this.items[factor];
    }

    getItems(): Array<number> {
        return this.items;
    }

    toObject(): object {
        return {
            'count': this.getItem(FactorType.COUNT),
            'reward': this.getItem(FactorType.REWARD),
            'stakeAmount': this.getItem(FactorType.STAKE_AMOUNT)
        };
    }
}
