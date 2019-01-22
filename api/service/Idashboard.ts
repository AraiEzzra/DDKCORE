interface IResponse {
    success: boolean;
    error?: Error;
}
interface ITransaction {}
interface IFreezeOrder {}
interface ITransactionForFreeze extends IResponse {
    transaction: ITransaction;
    referStatus: boolean;
}
interface IAllFreezeOrders extends IResponse {
    success: boolean;
    freezeOrders: Array<IFreezeOrder>;
    count: number;
}
interface IDDKFrozen extends IResponse {
    totalDDKStaked: {
        sum: number
    };
}
interface IRewardHistory extends IResponse {
    rewardHistory: Array<any>;
    count: number;
}
interface ICountStakeholders extends IResponse {
    countStakeholders: {
        count: number
    };
}
interface Account {}

export interface IDashboardService {
    addTransactionForFreeze (req: IRequest): ITransactionForFreeze;

    getAllFreezeOrders (account: Account, req: IRequest): IAllFreezeOrders;

    getAllActiveFreezeOrders (account: Account): IAllFreezeOrders;

    countStakeholders (req: IRequest): ICountStakeholders;

    getMyDDKFrozen (req: IRequest): IDDKFrozen;

    totalDDKStaked (req: IRequest): IDDKFrozen;

    getRewardHistory (req: IRequest): IRewardHistory;
}
