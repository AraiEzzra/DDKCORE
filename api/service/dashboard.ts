import {
    ITransactionForFreeze,
    IRequest
} from './../controller/dashboard';
declare class TransactionType {} // todo wait for trs type

export class DashboardService {
    addTransactionForFreeze (req: IRequest): Promise<ITransactionForFreeze<TransactionType>> {

    }
}
