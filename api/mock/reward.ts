import { Reward } from 'shared/model/reward';

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
    for (let i = 0; i < 14; i++) {
        rewards.push(generateReward(i));
    }
    return rewards;
};

export const generateReward = (index: number) => {
    const transactionId = Math.random().toString(36).substring(7);
    return new Reward({
        transactionId,
        type: TransactionType.STAKE,
        createdAt: Date.now() / 100,
        sponsor: 11111111,
        referral: 22222222,
        referralLevel: index + 1,
        amount: 100,
    });
};

