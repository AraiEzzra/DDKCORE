import { AccountService } from 'api/service/accountService';
import { Response, Request } from 'express';
import * as HttpStatus from 'http-status-codes';

export default class AccountController {

    private static instance: AccountController = undefined;
    private accountService: AccountService;

    constructor() {
        if(!AccountController.instance) {
            AccountController.instance = this;
        }
        return AccountController.instance;
    }

    createAccount(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getAccount(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getBalance(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getPublicKey(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    generatePublicKey(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: place this in DelegatesController
    getDelegates(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: place this in DelegatesController
    getDelegatesFee(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: place this in DelegatesController
    addDelegates(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getTotalAccounts(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getCirculatingSupply(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getTotalSupply(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    migrateData(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    validateExistingUser(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    verifyUserToComment(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    checkSenderAccountBalance(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    getMigratedUsersList(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    // TODO: exclude this method from AccountController. Place it in DashboardController.
    getDashboardDDKData(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }

    checkAccountExists(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }
}
