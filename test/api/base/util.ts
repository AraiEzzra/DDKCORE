import { SECOND } from 'core/util/const';
import { Timestamp } from 'shared/model/account';
import config from 'shared/config';
import { TransactionModel } from 'shared/model/transaction';

const TWO = 2;
const FIVE = 5;
const TEN = 10;
const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const randStr = (range) =>
    Array(range)
        .join()
        .split(',')
        .map(() => S.charAt(Math.floor(Math.random() * S.length)))
        .join('');

export const randNumber = (min: number = 0, max: number = Math.pow(TEN, TEN)): number =>
    max - Math.trunc(Math.random() * (max + (min >= 0 ? min : -1 * min)));

export const randEmail = (): string => `${randStr(TEN)}@${randStr(FIVE)}.${randStr(TWO)}`;

export const randName = (): string => randStr(1).toUpperCase() + randStr(FIVE);

export const randPhone = (): string => `+${randNumber()}`;

export const getEpochTime = (time: number = Date.now()): Timestamp => {
    const d = new Date(config.CONSTANTS.EPOCH_TIME);
    const t = d.getTime();

    return Math.floor((time - t) / SECOND);
};

export const getTime = (time?: number): Timestamp => {
    return this.getEpochTime(time);
};

export const getTransactionData = <T>(data: TransactionModel<T>): TransactionModel<T> => ({
    asset: data.asset,
    type: data.type,
    fee: data.fee,
    senderAddress: data.senderAddress,
    senderPublicKey: data.senderPublicKey
});

export const getPreparedTransactionData = <T>(data: TransactionModel<T>): TransactionModel<T> => {
    const result: TransactionModel<T> = {
        id: data.id,
        asset: data.asset,
        type: data.type,
        fee: data.fee,
        senderAddress: data.senderAddress,
        senderPublicKey: data.senderPublicKey,
        signature: data.signature,
        salt: data.salt,
        createdAt: data.createdAt
    };

    if (data.secondSignature !== undefined) {
        result.secondSignature = data.secondSignature;
    }

    return result;
};
