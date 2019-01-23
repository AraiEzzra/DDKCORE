import { StakeOrder } from 'shared/model/stake_order';
import { Transaction } from 'shared/model/transaction'; // wait for it

export interface Account {}
export interface IResponse {
    success: boolean;
    error?: Error;
}
export interface ITransactionForFreeze<T extends Object> extends IResponse {
    transaction: Transaction<T>;
    referStatus: boolean;
}
export interface IAllFreezeOrders extends IResponse {
    freezeOrders: Array<StakeOrder>;
    count: number;
}
export interface IDDKFrozen extends IResponse {
    totalDDKStaked: {
        sum: number
    };
}
export interface IRewardHistory extends IResponse {
    rewardHistory: Array<any>; // todo replace any
    count: number;
}
export interface ICountStakeholders extends IResponse {
    countStakeholders: {
        count: number
    };
}
export interface IRequest {
    body: {
        publicKey?: string;
        multisigAccountPublicKey?: string;
        secret?: string;
        secondSecret?: string;
        freezedAmount?: number;
        limit?: number;
        offset?: number;
        senderId?: string;
    };
}
declare class TransactionType {} // todo wait for trs type

export interface IDashboard {
    // todo change TransactionType to correct type
    addTransactionForFreeze (req: IRequest): Promise<ITransactionForFreeze<TransactionType>>;

    // todo change TransactionType to correct type
    getAllFreezeOrders (account: Account, req: IRequest): Promise<IAllFreezeOrders>;

    getAllActiveFreezeOrders (account: Account): Promise<IAllFreezeOrders>;

    countStakeholders (req: IRequest): Promise<ICountStakeholders>;

    getMyDDKFrozen (req: IRequest): Promise<IDDKFrozen>;

    totalDDKStaked (req: IRequest): Promise<IDDKFrozen>;

    getRewardHistory (req: IRequest): Promise<IRewardHistory>;
}

export class Dashboard implements IDashboard {
    constructor() {}

    @POST('/freeze')
    public async addTransactionForFreeze (req) {
        // wait for rps transaction creating
    }

    @POST('/getAllOrders')
    public async getAllFreezeOrders (account, req) {
    }

    @POST('/getAllActiveOrders')
    public async getAllActiveFreezeOrders (account) {
    }

    @GET('/countStakeholders')
    public async countStakeholders (req) {
    }

    @POST('/getMyDDKFrozen')
    public async getMyDDKFrozen (req) {
    }

    @GET('/getTotalDDKStaked')
    public async totalDDKStaked (req) {
    }

    @GET('/getRewardHistory')
    public async getRewardHistory (req) {
    }
}
