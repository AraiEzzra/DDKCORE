import { AccountService } from 'api/service/accountService';
import { AccountServiceImpl } from 'api/service/accountServiceImpl';
import { Response, Request } from 'express';
import * as HttpStatus from 'http-status-codes';

export default class AccountController {

    private static instance: AccountController = undefined;
    private accountService: AccountService;

    constructor() {
        if(!AccountController.instance) {
            AccountController.instance = this;
            this.accountService = new AccountServiceImpl();
        }
        return AccountController.instance;
    }

    public createAccount(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public getAccount(req: Request, res: Response) {
        // TODO: use getAccount from Service. generateAddressByPublicKey method here
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public getBalance(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public getPublicKey(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

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

    public getTotalAccounts(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public getCirculatingSupply(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public getTotalSupply(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public migrateData(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public validateExistingUser(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public verifyUserToComment(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public checkSenderAccountBalance(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public getMigratedUsersList(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: exclude this method from AccountController. Place it in DashboardController.
    public getDashboardDDKData(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    public checkAccountExists(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }
}
