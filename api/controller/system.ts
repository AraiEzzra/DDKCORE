import Response from 'shared/model/response';
import {BlockService} from 'api/service/block';

const constants = require('../../backlog/helpers/constants');

class RoundService {}

@Controller('?')
export class System {
    private blockService = new BlockService();
    private roundService = new RoundService(); // private blockReward = new BlockReward(); calcMilestone, calcSupply

    @GET('/status') // /getStatus
    public getStatus(): Response<{}> {
        const lastBlock = this.blockService.getLastBlock();

        return new Response({ data: {
                // modules.system.getBroadhash()
                broadhash: '',
                epoch: constants.epochTime,
                height: lastBlock.height,
                fee: this.blockService.calculateFee(),
                milestone: this.roundService.calcMilestone(lastBlock.height),
                // modules.system.getNethash()
                nethash: '',
                // __private.blockReward.calcReward(lastBlock.height)
                reward: 0,
                supply: this.roundService.calcSupply(lastBlock.height)
            }});
    }

}
