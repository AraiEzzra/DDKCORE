import RoundService from 'core/service/round';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';

class RoundController extends BaseController {

    @ON('ROUND_FINISH')
    generateRound(): void {
        RoundService.generateRound();
    }
}

export default new RoundController();
