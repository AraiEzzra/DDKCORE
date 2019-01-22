interface Account {}

interface IRequest {
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

    @POST('/')
    public  async addTransactionForFreeze (req: IRequest): Promise {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @POST('/')
    public async getAllFreezeOrders (account: Account, req: IRequest): Promise {
        return await this.dashboardService.addTransactionForFreeze(account, req.body);
    }

    @POST('/')
    public async getAllActiveFreezeOrders (account: Account): Promise {
        return await this.dashboardService.addTransactionForFreeze(account);
    }

    @GET('/')
    public async countStakeholders (req: IRequest): Promise {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @POST('/')
    public async getMyDDKFrozen (req: IRequest): Promise {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @GET('/')
    public async totalDDKStaked (req: IRequest): Promise {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }

    @GET('/')
    public async getRewardHistory (req: IRequest): Promise {
        return await this.dashboardService.addTransactionForFreeze(req.body);
    }
}
