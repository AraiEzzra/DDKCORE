import { StakeOrder } from 'shared/model/stake_order';
import { Transaction } from 'shared/model/transaction';
import { DashboardService } from './../service/dashboard';

export interface Account {}
export interface IResponse {
    success: boolean;
    error?: Error;
}
export interface ITransactionForFreeze<T extends Object> extends IResponse {
    transaction: Transaction<T>;
    referStatus: boolean;
}
export interface IAllFreezeOrders<T extends Object> extends IResponse {
    freezeOrders: Array<StakeOrder<T>>;
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

export interface IDashboard {
    addTransactionForFreeze (req: IRequest): Promise<ITransactionForFreeze>;

    getAllFreezeOrders (account: Account, req: IRequest): Promise<IAllFreezeOrders>;

    getAllActiveFreezeOrders (account: Account): Promise<IAllFreezeOrders>;

    countStakeholders (req: IRequest): Promise<ICountStakeholders>;

    getMyDDKFrozen (req: IRequest): Promise<IDDKFrozen>;

    totalDDKStaked (req: IRequest): Promise<IDDKFrozen>;

    getRewardHistory (req: IRequest): Promise<IRewardHistory>;
}

export class Dashboard implements IDashboard {
    private dashboardService = new DashboardService();
    constructor() {}

    @POST('/freeze')
    public async addTransactionForFreeze (req) {
        return await this.dashboardService.addTransactionForFreeze(req);
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
