import { Account } from 'shared/model/account';

export const isAccountReferrer = (referral: Account): boolean => {
    return !!referral.stakes.length;
};
