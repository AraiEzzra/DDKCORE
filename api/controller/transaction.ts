import {TransactionService, TransactionServiceImpl} from "api/service/transaction";
import {TransactionPGQLRepository, TransactionRepository} from "shared/repository/transaction";
import { ITransactionCreateRequest } from 'api/controller/transaction.d';



@Controller('/transaction')
export class TransactionController {

    private transactionService: TransactionService;
    private transactionRepository: TransactionRepository;

    constructor() {
        this.transactionService = new TransactionServiceImpl();
        this.transactionRepository = new TransactionPGQLRepository();
    }

    @GET('/all')
    @RPC('TRANSACTION_ALL')
    @validate(zShemaObj.transactionAll)
    all(data: { filter: any; sort: any }) {
        return this.transactionRepository.all(data.filter, data.sort);
    }

    @GET('/')
    @RPC('TRANSACTION_ONE')
    @validate(zShemaObj.transaction)
    one(id: string) {
        return this.transactionRepository.one(id);
    }

    @GET('/')
    @RPC('TRANSACTION_ONE')
    @validate(zShemaObj.transaction)
    history(id: string) {
        return this.transactionRepository.one(id);
    }

    @GET('/')
    @RPC('TRANSACTION_HISTORY')
    @validate(zShemaObj.transaction)
    history(id: string) {
        return this.transactionRepository.history(id);
    }

    @GET('/')
    @RPC('TRANSACTION_HISTORY')
    @validate(zShemaObj.transaction)
    history(id: string) {
        return this.transactionRepository.history(id);
    }

    @POST('/')
    @RPC('TRANSACTION_CREATE')
    @validate(zShemaObj.transaction)
    history(data: ITransactionCreateRequest) {
        return this.transactionRepository.history(id);
    }

}
