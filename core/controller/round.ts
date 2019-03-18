import RoundService from 'core/service/round';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { Block } from 'shared/model/block';

class RoundController extends BaseController {

    @ON('ROUND_FINISH')
    async generateRound(): Promise<void> {
        await RoundService.generateRound();
    }

    @ON('WARM_UP_FINISHED')
    async setIsBlockChainReady() {
        RoundService.setIsBlockChainReady(true);
        await RoundService.restoreRounds();
    }
}

export default new RoundController();
