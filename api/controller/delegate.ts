import { Request, Response, NextFunction, Error } from 'express';
import * as HttpStatus from 'http-status-codes';
import { DelegateRepository } from 'api/repository/delegate';
import { delegateSchema as schema } from 'api/schema/delegate';
import { Account } from 'shared/model/account';
import { DelegateRepository as SharedDelegateRepository } from 'shared/repository/delegate';
import { AccountPGQLRepository as SharedAccountRepository } from 'shared/repository/accountImpl';

// TODO need to constant.ts
const constants = require('../../backlog/helpers/constants');

// TODO TransactionType
declare enum TransactionType {
    Delegate = 30
}

// TODO Transaction model
declare class Transaction {}

export class DelegateController {
    private repo = new DelegateRepository();
    private sharedDelegateRepo = new SharedDelegateRepository();
    private sharedAccountRepo = new SharedAccountRepository();

    @GET('/count')
    public async count(req: Request, res: Response) {
        const result = await this.repo.count();
    }

    @GET('/search')
    @Validate(req.query, schema.search)
    public async search(req: Request, res: Response) {
        const { q, limit } = req.query;
        const result = await this.repo.search(q, limit, '', '');
    }

    @GET('/voters')
    @Validate(req.query, schema.getVoters)
    public async getVoters(req: Request, res: Response) {
        const { publicKey } = req.query;
        const result = await this.repo.getVoters(publicKey);
    }

    @GET('/')
    @Validate(req.query, schema.getDelegates)
    public async getDelegates(req: Request, res: Response) {
        const { orderBy, limit, offset } = req.query;
        const result = await this.sharedDelegateRepo.getDelegates(orderBy, limit, offset);
    }

    @GET('/get')
    @Validate(req.query, schema.getDelegate)
    public async getDelegate(req: Request, res: Response) {
        const { publicKey, username } = req.query;
        const result = await this.sharedDelegateRepo.getDelegate(publicKey, username);
    }

    @GET('/fee')
    public getFee(req: Request, res: Response) {
        const result = { fee: constants.fees.delegate };
    }

    @GET('/forging/getForgedByAccount')
    public async getForgedByAccount(req: Request, res: Response) {}


    // TODO Wait transaction create function
    @PUT('/')
    @Validate(req.body, schema.addDelegate)
    public async addDelegate(req: Request, res: Response) {
        const { publicKey } = req.query;
        const account: Account = await this.sharedAccountRepo.getAccount({ publicKey });

        if (!account || !account.publicKey) { /** 'Multisignature account not found'*/ }
        if (!account.multisignatures || !account.multisignatures) {/**'Account does not have multisignatures enabled'*/}
        /**
         * Body checks
         */
    }

    @GET('/getNextForgers')
    public async getNextForgers(req: Request, res: Response) {
        const result = {
            currentBlock: 0,
            currentBlockSlot: 0,
            currentSlot: 0,
            delegates: []
        };
    }

    @POST('forging/enable')
    @Validate(req.body, schema.enableForging)
    public async forgingEnable(req: Request, res: Response) {
        const { publicKey } = req.query;
        const account: Account = await this.sharedAccountRepo.getAccount({ publicKey });
        // ...
        const result = { address: account.address };
    }

    @POST('/forging/disable')
    @Validate(req.body, schema.disableForging)
    public async forgingDisable(req: Request, res: Response) {
        const { publicKey } = req.query;
        const account: Account = await this.sharedAccountRepo.getAccount({ publicKey });
        // ...
        const result = { address: account.address };
    }

    @GET('/getLatestVoters')
    public async getLatestVoters(req: Request, res: Response) {
        const { limit } = req.query;
        const voters: Transaction[] = await this.repo.getLatestVoters(limit as number);
        const result =  { voters };
    }

    @GET('/getLatestDelegates')
    public async getLatestDelegates(req: Request, res: Response) {
        const { limit } = req.query;
        const delegates: Transaction[] = await this.repo.getLatestDelegates(limit as number);
        const result =  { delegates };
    }
}


