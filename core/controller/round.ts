import RoundService from 'core/service/round';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import SyncService from 'core/service/sync';
import { logger } from 'shared/util/logger';

class RoundController extends BaseController {

    @ON('ROUND_FINISH')
    async generateRound(): Promise<void> {
        if (SyncService.consensus) {
            await RoundService.generateRound();
        } else {
            logger.debug(`[Controller][Round][generateRound]: consensus ${SyncService.getConsensus()}`);
        }
    }

    @ON('WARM_UP_FINISHED')
    async setIsBlockChainReady() {
        RoundService.setIsBlockChainReady(true);
        await RoundService.restoreRounds();
    }
}

export default new RoundController();
