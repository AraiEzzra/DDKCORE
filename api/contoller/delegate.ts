import { Request, Response, NextFunction, Error } from 'express';
import { DelegateService } from '../service/delegate';
import { DelegateModel } from 'shared/model/delegate';

interface IDelegatesArray {
    delegates: DelegateModel[];
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
}

export class DelegateController {
    private service = new DelegateService();

    public async count(req: Request, res: Response) {
        try {
            const count: number = await this.service.count();
            const result: IDelegateCount = { count };
            return result;
        } catch (error) {
        }
    }

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
    public async getVoters(req: Request, res: Response) {
        const { publicKey } = <IPublicKey> req.query;
        const result: null = await this.service.getVoters(publicKey);
    }
}
