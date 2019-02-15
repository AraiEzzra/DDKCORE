import { delegateCoreRepository } from 'core/repository/delegate';
import { RPC, ON } from 'core/util/decorator';
import Response from 'shared/model/response';
import { BaseController } from 'core/controller/baseController';

export class DelegateController extends BaseController {

    @RPC('FORGING_DISABLE')
    @ON('FORGING_DISABLE')
    public async forgingDisable(data) {
        const address = await delegateCoreRepository.forgingDisable(data);
        return address;
    }

    @RPC('FORGING_ENABLE')
    @ON('FORGING_ENABLE')
    public async forgingEnable(data) {
        const address = await delegateCoreRepository.forgingEnable(data);
        return address;
    }

    @RPC('FORGING_STATUS')
    @ON('FORGING_STATUS')
    public async forgingStatus(publicKey: string) {
        const res = await delegateCoreRepository.forgingStatus(publicKey);
        return res;
    }

    @ON('READY_FOR_FORGING')
    public blockchainReadyForForging() {}
}

export default new DelegateController();

