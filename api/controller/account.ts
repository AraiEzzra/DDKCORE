import { AccountService, AccountServiceImpl } from 'api/service/accountService';
import { GetAccountParams, RegistrationParams } from 'api/util/types/account';
import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import { AccountPGQLRepository, AccountRepository } from 'shared/repository/account';
import { GET, POST, Controller, validate } from 'api/util/http_decorator';
import { accountSchema as schema } from 'api/schema/account';

@Controller('/account')
export class AccountController {

    private accountService: AccountService;
    private accountRepository : AccountRepository;

    constructor() {
        this.accountService = new AccountServiceImpl();
        this.accountRepository = new AccountPGQLRepository();
    }

    // old version is /open
    @POST('/login')
    @ON('ACCOUNT_LOGIN')
    @RPC('ACCOUNT_LOGIN')
    @validate(schema.login)
    public login(secret: string) {
        return this.accountService.login(secret);
    }

    // old version is /open
    @POST('/register')
    @ON('ACCOUNT_REGISTER')
    @RPC('ACCOUNT_REGISTER')
    @validate(schema.register)
    public register(data: RegistrationParams) {
        return this.accountService.register(data);
    }

    @GET('/get_account')
    @ON('ACCOUNT_GET')
    @RPC('ACCOUNT_GET')
    @validate(schema.getAccount)
    public getAccount(data: GetAccountParams) {
        return this.accountService.getAccount(data);
    }

    // TODO use only Repository here
    @GET('/get_balance')
    @ON('ACCOUNT_GET_BALANCE')
    @RPC('ACCOUNT_GET_BALANCE')
    @validate(schema.getBalance)
    public getBalance(address: string) {
        return this.accountRepository.getAccountByAddress(address);
    }

    @GET('/get_public_key')
    @ON('ACCOUNT_GET_PUBLIC_KEY')
    @RPC('ACCOUNT_GET_PUBLIC_KEY')
    @validate(schema.getPublicKey)
    public getPublicKey(address: string) {
        return this.accountService.getPublicKey(address);
    }

    //TODO: maybe place this somewhere else
    @POST('/generate_public_key')
    @ON('ACCOUNT_GENERATE_PUBLIC_KEY')
    @RPC('ACCOUNT_GENERATE_PUBLIC_KEY')
    @validate(schema.generatePublicKey)
    public generatePublicKey(secret: string) {
        this.accountService.generatePublicKey(secret)
    }

    // TODO: place this in DelegatesController
    public getDelegates(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: place this in DelegatesController
    public getDelegatesFee(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: place this in DelegatesController
    public addDelegates(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @GET('/get_total_accounts')
    @ON('ACCOUNT_GET_TOTAL')
    @RPC('ACCOUNT_GET_TOTAL')
    @validate(schema.publicKey)
    public getTotalAccounts() {
        this.accountService.getTotalAccounts();
    }

    //TODO: maybe place this somewhere else
    @GET('/get_circulating_supply')
    @ON('ACCOUNT_GET_CIRCULATING_SUPPLY')
    @RPC('ACCOUNT_GET_CIRCULATING_SUPPLY')
    @validate(schema.getCirculatingSupply)
    public getCirculatingSupply() {
        return this.accountService.getCirculatingSupply();
    }

    //TODO: maybe place this somewhere else
    @GET('/get_total_supply')
    @ON('ACCOUNT_GET_TOTAL_SUPPLY')
    @RPC('ACCOUNT_GET_TOTAL_SUPPLY')
    @validate(schema.getTotalSupply)
    public getTotalSupply(address: string) {
        return this.accountRepository.getBalanceByAddress(address);
    }

    @POST('/check_sender_balance')
    @ON('ACCOUNT_CHECK_SENDER_BALANCE')
    @RPC('ACCOUNT_CHECK_SENDER_BALANCE')
    @validate(schema.checkSenderAccountBalance)
    public checkSenderAccountBalance(address: string) {
        return this.accountRepository.getBalanceByAddress(address);
    }

    // TODO: exclude this method from AccountController. Place it in DashboardController.
    public getDashboardDDKData(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @POST('/check_account_existence')
    @ON('ACCOUNT_CHECK_EXISTENCE')
    @RPC('ACCOUNT_CHECK_EXISTENCE')
    @validate(schema.checkAccountExistence)
    public checkAccountExistence(address: string) {
        this.accountRepository.getCountAccountByAddress(address);
    }
}

export default new AccountController();
