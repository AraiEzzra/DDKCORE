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
    q: {
        type: string,
        minLength: number,
        maxLength: number
    };
    limit: {
        type: number,
        minimum: number,
        maximum: number
    };
}
interface IPublicKey {
    publicKey: {
        type: string;
        format: string;
    };
}

export class DelegateController {
    private service : DelegateService;

    constructor(scope) {
        this.init(scope);
    }

    init(scope): void {
        this.service = new DelegateService(scope);
    }

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
