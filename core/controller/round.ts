import RoundService from 'core/service/round';
import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';

class RoundController extends BaseController {

    @ON('ROUND_FINISH')
    generateRound(): void {
        console.log('\n\n\n  @ON(\'ROUND_FINISH\')\n\n\n');
        RoundService.generateRound();
    }
}

export default new RoundController();
