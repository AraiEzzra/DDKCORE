import { IDashboardService } from 'api/service/Idashboard';

export class DashboardService extends IDashboardService {
    public  async addTransactionForFreeze (req) {}

    public async getAllFreezeOrders (account, req) {}

    public async getAllActiveFreezeOrders (account) {}

    public async countStakeholders (req) {}

    public async getMyDDKFrozen (req) {}

    public async totalDDKStaked (req) {}

    public async getRewardHistory (req) {}
}