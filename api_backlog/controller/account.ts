import { GetAccountParams, RegistrationParams } from 'api_backlog/util/types/account';
import { GET, POST, Controller, validate } from 'api_backlog/util/http_decorator';
import { AccountRepository } from 'api_backlog/repository/account';
import { accountSchema as schema } from 'api_backlog/schema/account';

import { AccountRepository as SharedAccountService } from 'shared/repository/account';
import { Account } from 'shared/model/account';

@Controller('/account')
export class AccountController {
    private accountRepository: AccountRepository;
    private sharedAccountRepo : SharedAccountService;

    constructor() {
        this.accountRepository = new AccountRepository();
        this.sharedAccountRepo = new SharedAccountService();
    }

    @POST('/register')
    @validate(schema.register)
    public register(data: RegistrationParams) {
        return this.accountRepository.register(data);
    }

    @GET('/get_account')
    @validate(schema.getAccount)
    public async getAccount(data: GetAccountParams) {
        return await this.sharedAccountRepo.getAccount(data.publicKey);
    }

    @GET('/get_balance')
    @validate(schema.getBalance)
    public async getBalance(address: string) {
        const balance: number = await this.sharedAccountRepo.getBalanceByAddress(address);
        return { balance };
    }

    @GET('/get_public_key')
    @validate(schema.getPublicKey)
    public async getPublicKey(address: string) {
        const account: Account =  await this.sharedAccountRepo.getAccountByAddress(address);
        return { publicKey: account.publicKey };
    }

    @POST('/generate_public_key')
    @validate(schema.generatePublicKey)
    public generatePublicKey(secret: string) {
        return this.sharedAccountRepo.generatePublicKey(secret);
    }

    @GET('/get_total_accounts')
    @validate({})
    public async getTotalAccounts() {
        const count = await this.sharedAccountRepo.getCountAccounts();
        return { count };
    }

    @POST('/check_sender_balance')
    @validate({})
    public checkSenderAccountBalance(address: string) {
        return this.sharedAccountRepo.getBalanceByAddress(address);
    }
}

export default new AccountController();
