import { Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';

export interface IDashboardResponse {
    totalDDKStaked: number;
    totalSupply: number;
    circulatingSupply: number;
    account: Account;
    transactions: {
        data: Array<Transaction<Object>>,
        count: number,
    };
    unconfirmedTransaction?: {
        count: 0,
        data: Array<Transaction<Object>>,
    };
    countStakeholders: number;
    accountsCount: number;
    delegate: Delegate; // wait for Davids implementation
    forgingStatus: {
        enabled?: boolean;
        delegates: any; // wait for Davids implementation
    };
}

declare class Delegate {}

export class Dashboard implements IDashboardResponse {
    totalSupply: number;
    circulatingSupply: number;
    account: Account;
    transactions: { data: Array<Transaction<Object>>; count: number };
    unconfirmedTransaction?: { count: any; data: Array<Transaction<Object>> };
    countStakeholders: number;
    accountsCount: number;
    delegate: Delegate;
    forgingStatus: { enabled?: boolean; delegates: any };
    totalDDKStaked: number;

    constructor(rawData?: any = {}) {
        this.totalSupply = Number(rawData.totalSupply) || 0;
        this.circulatingSupply = Number(rawData.circulatingSupply) || 0;
        this.account = rawData.account || [];
        this.transactions = rawData.transactions || {
            data: rawData.transactions.data || [],
            count: Number(rawData.transactions.count) || 0,
        };
        if (rawData.unconfirmedTransaction) {
            this.unconfirmedTransaction = {
                count: rawData.unconfirmedTransaction.count || 0,
                data: rawData.unconfirmedTransaction.data || []
            };
        }
        this.countStakeholders = Number(rawData.countStakeholders) || 0;
        this.accountsCount = Number(rawData.accountsCount) || 0;
        this.delegate = rawData.delegate || [];
        this.forgingStatus = rawData.forgingStatus; // todo implement from David
        this.totalDDKStaked = Number(rawData.totalDDKStaked) || 0;
    }
}