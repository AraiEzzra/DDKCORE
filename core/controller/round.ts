import { RoundService } from 'core/service/round';
import { Controller } from 'core/util/decorator';

@Controller('/round')
export class RoundController {
    private roundService: RoundService = new RoundService();

    constructor() {}

    @ON('ROUND_FINISH')
    generateRound(): void {
        this.roundService.generateRound();
    }
}
