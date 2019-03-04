import { Dashboard } from 'shared/model/dashboard';
import Response from 'shared/model/response';
import { AccountPGQLRepository } from 'shared/repository/account';
import { GET, Controller } from 'api/util/http_decorator';

export interface IRequest {
    body: {
        publicKey: string;
        secondSecret?: string;
    };
}


declare class DelegateReposytory {} // wait from David
declare class StakeOrderRepo {} // wait repo
declare class TransactionRepository {
} // wait repo

@Controller('/dashboard')
export class DashboardController {
    private accountsRepo: AccountPGQLRepository;
    private delegateRepo: DelegateReposytory;
    private stakeOrderRepo: StakeOrderRepo;
    private transactionRepo: TransactionRepository;

    constructor () {
    }

    @GET('/get')
    public async getDashBoard (req: IRequest): Promise<Response<Dashboard>> {
        let data = new Dashboard();
        let errors = undefined;

        try {
            // todo get from Rx bus
            data.delegate = await this.delegateRepo.get(req);
            data.totalSupply = await this.accountsRepo.totalSupply(req);
            data.circulatingSupply = await this.accountsRepo.circulatingSupply(req);
            data.account = await this.accountsRepo.get(req);
            data.transactions = await this.transactionRepo.get(req);
            data.unconfirmedTransaction = await this.transactionRepo.unconfirmedTransaction(req);
            data.countStakeholders = await this.stakeOrderRepo.countStakeholders(req);
            data.accountsCount = await this.accountsRepo.accountsCount(req);
            data.forgingStatus = await this.delegateRepo.forgingStatus(req);
            data.totalDDKStaked = await this.stakeOrderRepo.totalDDKStaked(req);

        } catch (error) {
            errors = error;
        }

        return new Response({
            data,
            errors
        });
    }
}
