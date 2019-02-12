import { delegateCoreRepository } from 'core/repository/delegate';

export class DelegateController {

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


}
