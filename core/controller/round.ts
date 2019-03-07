import RoundService from 'core/service/round';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { Block } from 'shared/model/block';

class RoundController extends BaseController {

    @ON('ROUND_FINISH')
    generateRound(): void {
        RoundService.generateRound();
    }

    @ON('NEW_BLOCKS')
    restoreRounds(block: Block) {
        RoundService.restoreRounds(block);
    }

    @ON('WARM_UP_FINISHED')
    setIsBlockChainReady() {
        RoundService.setIsBlockChainReady(true);
    }
}

export default new RoundController();
