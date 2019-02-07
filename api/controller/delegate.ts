import { DelegateRepository } from 'api/repository/delegate';
import { delegateSchema as schema } from 'api/schema/delegate';
import { Account } from 'shared/model/account';
import { DelegateRepository as SharedDelegateRepository } from 'shared/repository/delegate';
import { AccountRepository as SharedAccountRepository } from 'shared/repository/account';
import { GET, POST, Controller, validate, PUT } from 'api/util/http_decorator';
import {Request, Response} from 'express';
import * as HttpStatus from 'http-status-codes';
const constants = require('../../backlog/helpers/constants');

interface IDataContainer<T extends Object> {
    body: T;
}

interface IReqSearch {
    q: string;
    limit: number;
}

interface IReqGetDelegates {
    orderBy: string;
    limit: number;
    offset: number;
}

interface IReqPublicKey {
    publicKey: string;
}

@Controller('/delegate')
export class DelegateController {
    private repo = new DelegateRepository();
    private sharedDelegateRepo = new SharedDelegateRepository();
    private sharedAccountRepo = new SharedAccountRepository();

    @GET('/count')
    public async count() {
        const result = await this.repo.count();
    }

    @GET('/search')
    @validate(schema.search)
    public async search(data: IDataContainer<IReqSearch>) {
        const { q, limit } = data.body;
        const result = await this.repo.search(q, limit, '', '');
    }

    @GET('/voters')
    @validate(schema.getVoters)
    public async getVoters(data: IDataContainer<IReqPublicKey>) {
        const { publicKey } = data.body;
        const result = await this.repo.getVoters(publicKey);
    }

    @GET('/')
    @validate(schema.getDelegates)
    public async getDelegates(data: IDataContainer<IReqGetDelegates>) {
        const { orderBy, limit, offset } = data.body;
        const result = await this.sharedDelegateRepo.getDelegates(orderBy, limit, offset);
    }

    @GET('/get')
    @validate(schema.getDelegate)
    public async getDelegate(data: IDataContainer<{ publicKey: string, username: string }>) {
        const { publicKey, username } = data.body;
        const result = await this.sharedDelegateRepo.getDelegate(publicKey, username);
    }

    @GET('/fee')
    public getFee() {
        const result = { fee: constants.fees.delegate };
    }

    @GET('/forging/forged_by_account')
    public async getForgedByAccount() {}

    @PUT('/')
    @validate(schema.addDelegate)
    public async addDelegate(data: IDataContainer<IReqPublicKey>) {
        const { publicKey } = data.body;
        const account: Account = await this.sharedAccountRepo.getAccount({ publicKey });
    }

    @GET('/next_forgers')
    public async getNextForgers() {
        const result = {
            currentBlock: 0,
            currentBlockSlot: 0,
            currentSlot: 0,
            delegates: []
        };
    }

    @POST('/forging/enable')
    @validate(schema.enableForging)
    public async forgingEnable(data: IDataContainer<IReqPublicKey>) {
        const { publicKey } = data.body;
        const account: Account = await this.sharedAccountRepo.getAccount({ publicKey });
        // ...
        const result = { address: account.address };
    }

    @POST('/forging/disable')
    @validate(schema.disableForging)
    public async forgingDisable(data: IDataContainer<IReqPublicKey>) {
        const { publicKey } = data.body;
        const result = await this.sharedAccountRepo.getAccount({ publicKey });
    }

    @GET('/latest_voters')
    public async getLatestVoters(data: IDataContainer<{limit: number}>) {
        const { limit } = data.body;
        const result = await this.repo.getLatestVoters(limit as number);
    }

    @GET('/latest_delegates')
    public async getLatestDelegates(data: IDataContainer<{limit: number}>) {
        const { limit } = data.body;
        const result = await this.repo.getLatestDelegates(limit as number);
    }

    @GET('/forging/status')
    @validate(schema.forgingStatus)
    public async forgingStatus(data: IDataContainer<IReqPublicKey>) {}

    // TODO: place this in DelegatesController
    public getDelegates(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'});
    }

    // TODO: place this in DelegatesController
    public getDelegatesFee(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'});
    }

    // TODO: place this in DelegatesController
    public addDelegates(req: Request, res: Response) {
        res.status(HttpStatus.OK).json({msg: 'SUCCESS'});
    }
}


