import { IRoundService } from 'core/service/round';
import { Controller } from 'core/util/decorator';

declare class RoundService {} // todo until RoundService implementation

@Controller('/round')
export class RoundController {
    private roundService: IRoundService = new RoundService();

    constructor() {}

    @ON('ROUND_ROUNDFINISH')
    generateRound(): void {
        this.roundService.generateRound();
    }
}