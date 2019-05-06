import { Account, Address } from 'shared/model/account';

export interface IReferredUsers {
    add(account: Account): void;
    delete(account: Account): void;
    getUsers(account: Account, level: number): Array<IReferredUser>;
    updateCount(account: Account, count: number): void;
}

export interface IReferredUser {
    address: Address;
    isEmpty: boolean;
    factors: Factors;
}

export enum FactorType {
    COUNT = 'count',
    REWARD = 'reward',
    STAKE_AMOUNT = 'stakeAmount'
}

export type Factors = Map<FactorType, number>;
