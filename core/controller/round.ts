import { RoundService } from 'core/service/round';
import { Controller, ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';

@Controller('/round')
class RoundController extends BaseController {
    private roundService: RoundService = new RoundService();

    @ON('ROUND_FINISH')
    generateRound(): void {
        this.roundService.generateRound();
    }
}

export default new RoundController();
