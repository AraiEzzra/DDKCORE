import { AccountServiceImpl } from 'api/service/accountService';
import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';

@Controller('/account')
export class AccountController {

    private accountService;

    constructor() {
        this.accountService = new AccountServiceImpl();
    }

    // old version is /open
    @POST('/login')
    @ON('ACCOUNT_LOGIN')
    @RPC('ACCOUNT_LOGIN')
    @validate(zSchemaObj.login)
    public login(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // old version is /open
    @POST('/register')
    @ON('ACCOUNT_REGISTER')
    @RPC('ACCOUNT_REGISTER')
    @validate(zSchemaObj.register)
    public register(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @GET('/get_account')
    @ON('ACCOUNT_GET')
    @RPC('ACCOUNT_GET')
    @validate(zSchemaObj.getAccount)
    public getAccount(req: Request, res: Response) {
        // TODO: use getAccount from Service. generateAddressByPublicKey method here
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @GET('/get_balance')
    @ON('ACCOUNT_GET_BALANCE')
    @RPC('ACCOUNT_GET_BALANCE')
    @validate(zSchemaObj.getBalance)
    public getBalance(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @GET('/get_public_key')
    @ON('ACCOUNT_GET_PUBLIC_KEY')
    @RPC('ACCOUNT_GET_PUBLIC_KEY')
    @validate(zSchemaObj.getPublicKey)
    public getPublicKey(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    //TODO: maybe place this somewhere else
    @POST('/generate_public_key')
    @ON('ACCOUNT_GENERATE_PUBLIC_KEY')
    @RPC('ACCOUNT_GENERATE_PUBLIC_KEY')
    @validate(zSchemaObj.generatePublicKey)
    public generatePublicKey(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
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
    @validate(zSchemaObj.publicKey)
    public getTotalAccounts(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @GET('/get_circulating_supply')
    @ON('ACCOUNT_GET_CIRCULATING_SUPPLY')
    @RPC('ACCOUNT_GET_CIRCULATING_SUPPLY')
    @validate(zSchemaObj.getCirculatingSupply)
    public getCirculatingSupply(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @GET('/get_total_supply')
    @ON('ACCOUNT_GET_TOTAL_SUPPLY')
    @RPC('ACCOUNT_GET_TOTAL_SUPPLY')
    @validate(zSchemaObj.getTotalSupply)
    public getTotalSupply(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // old version is /existingETPSUser/validate
    @POST('/validate')
    @ON('ACCOUNT_VALIDATE')
    @RPC('ACCOUNT_VALIDATE')
    @validate(zSchemaObj.getTotalSupply)
    public validateExistingUser(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @POST('/verify_account_to_comment')
    @ON('ACCOUNT_VERIFY_TO_COMMENT')
    @RPC('ACCOUNT_VERIFY_TO_COMMENT')
    @validate(zSchemaObj.verifyAccountToComment)
    public verifyAccountToComment(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @POST('/check_sender_balance')
    @ON('ACCOUNT_CHECK_SENDER_BALANCE')
    @RPC('ACCOUNT_CHECK_SENDER_BALANCE')
    @validate(zSchemaObj.checkSenderAccountBalance)
    public checkSenderAccountBalance(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }


    // TODO: exclude this method from AccountController. Place it in DashboardController.
    public getDashboardDDKData(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    @POST('/check_account_existence')
    @ON('ACCOUNT_CHECK_EXISTENCE')
    @RPC('ACCOUNT_CHECK_EXISTENCE')
    @validate(zSchemaObj.checkAccountExistence)
    public checkAccountExistence(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }
}

export default new AccountController();
