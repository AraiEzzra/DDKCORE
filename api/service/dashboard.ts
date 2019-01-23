import {
    ITransactionForFreeze,
    IRequest
} from './../controller/dashboard';

export interface IDashboardService {
    addTransactionForFreeze (req: IRequest): Promise<ITransactionForFreeze>;
}

export class DashboardService implements IDashboardService {
    addTransactionForFreeze (req) {
        // create transaction end return response
        return new Promise(resolve => {});
    }
}
