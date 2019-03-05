import { DelegateRepository } from 'api_backlog/repository/delegate';
import { delegateSchema as schema } from 'api_backlog/schema/delegate';
import { Account } from 'shared/model/account';
import { DelegateRepository as SharedDelegateRepository } from 'shared/repository/delegate';
import { AccountRepository as SharedAccountRepository } from 'shared/repository/account';
import { GET, POST, Controller, validate, PUT } from 'api_backlog/util/http_decorator';
import {Request, Response} from 'express';
import * as HttpStatus from 'http-status-codes';
import constants from 'config/default/constants';

declare const BigInt;

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
    private delegateRepo = new DelegateRepository();
    private sharedDelegateRepo = new SharedDelegateRepository();
    private sharedAccountRepo = new SharedAccountRepository();

    @GET('/count')
    public async count() {
        const result = await this.delegateRepo.count();
    }

    @GET('/search')
    @validate(schema.search)
    public async search(data: IDataContainer<IReqSearch>) {
        const { q, limit } = data.body;
        const result = await this.delegateRepo.search(q, limit, '', '');
    }

    @GET('/voters')
    @validate(schema.getVoters)
    public async getVoters(data: IDataContainer<IReqPublicKey>) {
        const { publicKey } = data.body;
        const result = await this.delegateRepo.getVoters(publicKey);
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
        return { fee: constants.fees.delegate };
    }

    @GET('/forging/forged_by_account')
    public async getForgedByAccount(data: any) {
        return;
    }

    @GET('/forging/status')
    @validate(schema.forgingStatus)
    public async forgingStatus(data: IDataContainer<IReqPublicKey>) {}

    @POST('/')
    public async addDelegates(data) {
        const res = await this.delegateRepo.addDelegates(data);
        return res;
    }
}


