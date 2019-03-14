import { RPC_METHODS } from 'api/middleware/rpcHolder';
import RewardControllerInstance, { RewardController } from 'api/controller/reward';
import ReferredUsersControllerInstance, { ReferredUsersController } from 'api/controller/referredUsers';
import AccountControllerInstance, { AccountController } from 'api/controller/account';
import DelegateControllerInstance, { DelegateController } from 'api/controller/delegate';
import BlockControllerInstance, { BlockController } from 'api/controller/block';
import TransactionControllerInstance, { TransactionController } from 'api/controller/transaction';
import { ApiRPC } from 'api/utils/rpc';

export class Middleware {

    private rewardController: RewardController;
    private referredUsersController: ReferredUsersController;
    private accountController: AccountController;
    private delegateController: DelegateController;
    private blockController: BlockController;
    private transactionController: TransactionController;

    constructor() {
        this.rewardController = RewardControllerInstance;
        this.referredUsersController = ReferredUsersControllerInstance;
        this.accountController = AccountControllerInstance;
        this.delegateController = DelegateControllerInstance;
        this.blockController = BlockControllerInstance;
        this.transactionController = TransactionControllerInstance;

        this.registerRPC();
    }

    processRequest(code: string, data: any, token?: string, socket?: any) {
        const method = RPC_METHODS[code];
        if (typeof method === 'function') {
            return method(data, token, socket);
        }
    }

    registerRPC() {
        const rps = new ApiRPC();
        rps.listenRPC();
    }
}

export default new Middleware();
