import { RPC_METHODS } from 'api/middleware/rpcHolder';
import RewardControllerInstance, { RewardController } from 'api/controller/reward';

export class Middleware {

    private rewardController: RewardController;

    constructor() {
        this.rewardController = RewardControllerInstance;
    }

    processRequest(code: string, data: any, token?: string, socket?: any) {
        const method = RPC_METHODS[code];
        console.log('RPC_METHODS: ', RPC_METHODS);
        if (typeof method === 'function') {
            return method(data, token, socket);
        }
    }
}

export default new Middleware();
