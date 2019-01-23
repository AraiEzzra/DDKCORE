import {
    IAllFreezeOrders,
    ICountStakeholders,
    IDDKFrozen,
    IRequest,
    IRewardHistory
} from './../controller/dashboard';
import { Account } from './../../shared/model/account';
import { StakeOrder } from 'shared/model/stake_order';

export interface IDashboardRepository extends StakeOrder {
    getAllFreezeOrders (account: Account, req: IRequest): Promise<IAllFreezeOrders>;

    getAllActiveFreezeOrders (account: Account): Promise<IAllFreezeOrders>;

    countStakeholders (req: IRequest): Promise<ICountStakeholders>;

    getMyDDKFrozen (req: IRequest): Promise<IDDKFrozen>;

    totalDDKStaked (req: IRequest): Promise<IDDKFrozen>;

    getRewardHistory (req: IRequest): Promise<IRewardHistory>;
}
