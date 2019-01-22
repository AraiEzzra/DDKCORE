import {
    IRequest,
    IAllFreezeOrders,
    ICountStakeholders,
    IDDKFrozen,
    IRewardHistory,
    ITransactionForFreeze,
    Account,
} from './../contoller/dashboard';

interface IRequestBody extends Pick<IRequest, 'body'> {}
export interface IDashboardService {
    addTransactionForFreeze (req: IRequestBody): ITransactionForFreeze;

    getAllFreezeOrders (account: Account, req: IRequestBody): IAllFreezeOrders;

    getAllActiveFreezeOrders (account: Account): IAllFreezeOrders;

    countStakeholders (req: IRequestBody): ICountStakeholders;

    getMyDDKFrozen (req: IRequestBody): IDDKFrozen;

    totalDDKStaked (req: IRequestBody): IDDKFrozen;

    getRewardHistory (req: IRequestBody): IRewardHistory;
}
