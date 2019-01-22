import { Request, Response, NextFunction, Error } from 'express';
import { DelegateService } from '../service/delegate';
import { DelegateModel } from 'shared/model/delegate';

interface IDelegatesArray {
    delegates: DelegateModel[];
    totalCount?: number;
}

interface IDelegateCount {
    count: number;
}

interface IDelegateSearchRequest {
    q: string;
    limit: number;
}
interface IPublicKey {
    publicKey: string;
    username?: string;
}

interface IGetDelegates {
    orderBy: string;
    limit: number;
    offset: number;
}

export class DelegateController {
    private service = new DelegateService();

    @GET('/count')
    public async count(req: Request, res: Response) {
        try {
            const count: number = await this.service.count();
            const result: IDelegateCount = { count };
            return result;
        } catch (error) {
        }
    }

    @GET('/search')
    public async search(req: Request, res: Response) {
        try {
            const { q, limit } = <IDelegateSearchRequest> req.query;
            const delegates: DelegateModel[] = await this.service.search(q, limit);
            const result: IDelegatesArray = { delegates };
            return result;
        } catch (error) {
        }
    }

    /**
     * Need to Account Model
     * @param req
     * @param res
     */
    @GET('/voters')
    public async getVoters(req: Request, res: Response) {
        try {
            const { publicKey } = <IPublicKey> req.query;
            const result: null = await this.service.getVoters(publicKey);
        } catch (error) {
        }
    }

    @GET('/')
    public async getDelegates(req: Request, res: Response) {
        try {
            const { orderBy, limit, offset } = <IGetDelegates> req.query;
            const result: IDelegatesArray = await this.service.getDelegates(orderBy, limit, offset);
        } catch (error) {
        }
    }

    @GET('/get')
    public async getDelegate(req: Request, res: Response) {
        try {
            const { publicKey, username } = <IPublicKey> req.query;
            const delegate: DelegateModel = await this.service.getDelegate(publicKey, username);
            const result = { delegate };
        } catch (error) {
        }
    }
}
