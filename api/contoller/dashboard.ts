export interface Account {}
export interface IResponse {
    success: boolean;
    error?: Error;
}
export interface ITransaction {}
export interface IFreezeOrder {}
export interface ITransactionForFreeze extends IResponse {
    transaction: ITransaction;
    referStatus: boolean;
}
export interface IAllFreezeOrders extends IResponse {
    success: boolean;
    freezeOrders: Array<IFreezeOrder>;
    count: number;
}
export interface IDDKFrozen extends IResponse {
    totalDDKStaked: {
        sum: number
    };
}
export interface IRewardHistory extends IResponse {
    rewardHistory: Array<any>;
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

import { DashboardService } from './../service/dashboard';

export class Dashboard {
    private dashboardService = new DashboardService();
    constructor() {}

    @POST('/freeze')
    public  async addTransactionForFreeze (req: IRequest): Promise<ITransactionForFreeze> {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @POST('/getAllOrders')
    public async getAllFreezeOrders (account: Account, req: IRequest): Promise<IAllFreezeOrders> {
        return await this.dashboardService.addTransactionForFreeze(account, req.body);
    }

    @POST('/getAllActiveOrders')
    public async getAllActiveFreezeOrders (account: Account): Promise<IAllFreezeOrders> {
        return await this.dashboardService.addTransactionForFreeze(account);
    }

    @GET('/countStakeholders')
    public async countStakeholders (req: IRequest): Promise<ICountStakeholders> {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @POST('/getMyDDKFrozen')
    public async getMyDDKFrozen (req: IRequest): Promise<IDDKFrozen> {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @GET('/getTotalDDKStaked')
    public async totalDDKStaked (req: IRequest): Promise<IDDKFrozen> {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @GET('/getRewardHistory')
    public async getRewardHistory (req: IRequest): Promise<IRewardHistory> {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }
}
