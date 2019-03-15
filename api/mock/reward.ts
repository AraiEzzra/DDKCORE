import { Reward } from 'shared/model/reward';

const STAKE_REWARDS_COUNT =  5;
const REFERRED_REWARDS_COUNT = 14;

export enum TransactionType {
    REGISTER = 0,
    SEND = 10,
    SIGNATURE = 20,
    DELEGATE = 30,
    STAKE = 40,
    SENDSTAKE = 50,
    VOTE = 60,
}

export const generateRewards = (): Array<Reward> => {
    const rewards = [];
    for (let i = 0; i < REFERRED_REWARDS_COUNT; i++) {
        rewards.push(generateReward(i));
    }
    return rewards;
};

export const generateReward = (index: number): Reward => {
    const transactionId = Math.random().toString(36).substring(7);
    return new Reward({
        transactionId,
        type: TransactionType.STAKE,
        createdAt: Date.now() / 100,
        sponsor: BigInt(11111111),
        referral: BigInt(22222222),
        referralLevel: index + 1,
        amount: 100,
    });
};

export const generateStakeRewards = (): Array<Reward> => {
    const rewards = [];
    for (let i = 0; i < STAKE_REWARDS_COUNT; i++) {
        rewards.push(generateStakeReward());
    }
    return rewards;
};

export const generateStakeReward = (): Reward => {
    const transactionId = Math.random().toString(36).substring(7);
    return new Reward({
        transactionId,
        type: TransactionType.STAKE,
        createdAt: Date.now() / 100,
        sponsor: BigInt(11111111),
        referral: BigInt(11111111),
        amount: 100,
    });
};
