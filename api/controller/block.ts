import {BlockService} from 'api/service/block';
import Response from 'shared/model/response';
import {Block} from 'shared/model/block';
import {BlockRepo} from 'api/repository/block';
import schema from 'api/schema/block';

const constants = require('../../backlog/helpers/constants');

// wait declaration from @Bogdan Pidoprygora
class RoundService {}

@Controller('/blocks')
export class BlockController {
    private roundService = new RoundService(); // private blockReward = new BlockReward(); calcMilestone, calcSupply
    private blockService = new BlockService();
    private blockRepo = new BlockRepo();

    constructor() {}

    @GET('/')
    @validate(schema.getBlocks)
    public getBlocks(req): Response<{ blocks: Block[], count: number }> {
        let data: Response<{ blocks: Block[], count: number }> = this.blockService.list(req.body);
        return new Response({ data: { blocks: data.data.blocks, count: data.data.count }});
    }

    @GET('/get')
    @validate(schema.getBlock)
    public getBlock(req): Response<{ block: Block }> {
        let block: Block = this.blockRepo.getById(req.body.id);
        return new Response({ data: { block } });
    }

    @GET('/broadhash') // /getBroadhash
    public getBroadhash(): Response<{ broadhash: string }> {
        const broadhash = ''; // modules.system.getBroadhash()
        return new Response({ data: { broadhash }});
    }

    @GET('/epoch') // /getEpoch
    public getEpoch(): Response<{ epoch: string }> {
        return new Response({ data: { epoch: constants.epochTime }});
    }

    @GET('/height') // /getHeight
    public getHeight(): Response<{ height: number }> {
        const height = 0; // modules.blocks.lastBlock.get().height
        return new Response({ data: { height }});
    }

    @GET('/fee') // /getFee
    public getFee(): Response<{ fee: number }> {
        return new Response({ data: { fee: this.blockService.calculateFee() }});
    }

    @GET('/fees') // /getFees
    public getFees(): Response<{ fees: number }> {
        return new Response({ data: { fees: constants.fees }});
    }

    @GET('/nethash') // /getNethash
    public getNethash(): Response<{ nethash: string }> {
        const nethash = ''; // modules.system.getNethash()
        return new Response({ data: { nethash }});
    }

    @GET('/milestone') // /getMilestone
    public getMilestone(): Response<{ milestone: number }> {
        return new Response({ data: { milestone: this.roundService.calcMilestone(this.blockService.getLastBlock().height) }});
    }

    @GET('/reward') // /getReward
    public getReward(): Response<{ reward: number }> {
        // __private.blockReward.calcReward(modules.blocks.lastBlock.get().height)}
        return new Response({ data: { reward: 0 }});
    }

    @GET('/supply') // /getSupply
    public getSupply(): Response<{ supply: number }> {
        return new Response({ data: { supply: this.roundService.calcSupply(this.blockService.getLastBlock().height) }});
    }
}
