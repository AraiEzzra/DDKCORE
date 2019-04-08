import RoundService from 'core/service/round';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import SyncService from 'core/service/sync';
import { logger } from 'shared/util/logger';

class RoundController extends BaseController {

    @ON('ROUND_FINISH')
    generateRound(): void {
        if (SyncService.consensus) {
            RoundService.forwardProcess();
        } else {
            logger.debug(`[Controller][Round][generateRound]: consensus ${SyncService.getConsensus()}`);
        }
    }

    @ON('WARM_UP_FINISHED')
     setIsBlockChainReady(): void {
        RoundService.setIsBlockChainReady(true);
        RoundService.restore();
    }
}

export default new RoundController();
