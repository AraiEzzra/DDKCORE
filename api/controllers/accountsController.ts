import { Response, Request } from 'express';
import * as HttpStatus from 'http-status-codes';
import { generateAddressByPublicKey } from 'shared/modules/accounts';
import ZSchema = require('shared/utils/z_schema');
import accountSchema = require('shared/schema/accounts.js');

class AccountsController {
    private static instance: AccountsController = undefined;

    constructor() {
        if(!AccountsController.instance) {
            AccountsController.instance = this;
        }
        return AccountsController.instance;
    }

    getAccount(req: Request, res: Response) {
        const validator = new ZSchema();
        const isValid = validator.validate(req.body,accountSchema.getAccount);

        if(!isValid){
            res.status(HttpStatus.BAD_REQUEST).json({msg: 'Invalid request'});
        }

        if (!req.body.address && !req.body.publicKey) {
            res.status(HttpStatus.BAD_REQUEST).json({msg: 'Missing required property: address or publicKey'})
        }

        const address = req.body.publicKey ? generateAddressByPublicKey(req.body.publicKey) : req.body.address;
        if (req.body.address && req.body.publicKey && address !== req.body.address) {
            res.status(HttpStatus.BAD_REQUEST).json({msg: 'Account publicKey does not match address'})
        }

        res.status(HttpStatus.OK).json({msg: 'SUCCESS'})
    }
}

const accountController = new AccountsController();
export default accountController;
