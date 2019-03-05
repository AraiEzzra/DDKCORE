import BlockService from 'api/service/block';
import Response from 'shared/model/response';
import { Block } from 'shared/model/block';
import BlockRepo from 'api/repository/block';
import schema from 'api/schema/block';
import config from 'shared/util/config';
import { Controller, GET, validate } from 'api/util/http_decorator';

// wait declaration from @Bogdan Pidoprygora
class RoundService {
    calcMilestone(height: number): number { return undefined; }
    calcSupply(height: number): number { return undefined; }
}

@Controller('/blocks')
export class BlockController {
    // todo: remove after implementation as singleton
    private roundService = new RoundService(); // private blockReward = new BlockReward(); calcMilestone, calcSupply

    @GET('/')
    @validate(schema.getBlocks)
    public getBlocks(req): Response<{ blocks: Block[], count: number }> {
        let data: Response<{ blocks: Block[], count: number }> = BlockService.list(req.body);
        return new Response({ data: { blocks: data.data.blocks, count: data.data.count }});
    }

    @GET('/get')
    @validate(schema.getBlock)
    public getBlock(req): Response<{ block: Block }> {
        let block: Block = BlockRepo.getById(req.body.id);
        return new Response({ data: { block } });
    }

    @GET('/broadhash') // /getBroadhash
    public getBroadhash(): Response<{ broadhash: string }> {
        const broadhash = ''; // modules.system.getBroadhash()
        return new Response({ data: { broadhash }});
    }

    @GET('/epoch') // /getEpoch
    public getEpoch(): Response<{ epoch: number }> {
        return new Response({ data: { epoch: config.constants.epochTime }});
    }

    @GET('/height') // /getHeight
    public getHeight(): Response<{ height: number }> {
        const height = 0; // modules.blocks.lastBlock.get().height
        return new Response({ data: { height }});
    }

    @GET('/fee') // /getFee
    public getFee(): Response<{ fee: number }> {
        return new Response({ data: { fee: BlockService.calculateFee() }});
    }

    @GET('/fees') // /getFees
    public getFees(): Response<{ fees: object }> {
        return new Response({ data: { fees: config.constants.fees }});
    }

    @GET('/nethash') // /getNethash
    public getNethash(): Response<{ nethash: string }> {
        const nethash = ''; // modules.system.getNethash()
        return new Response({ data: { nethash }});
    }

    @GET('/milestone') // /getMilestone
    public getMilestone(): Response<{ milestone: number }> {
        return new Response({ data: {
            milestone: this.roundService.calcMilestone(BlockService.getLastBlock().height) }
        });
    }

    @GET('/reward') // /getReward
    public getReward(): Response<{ reward: number }> {
        // __private.blockReward.calcReward(modules.blocks.lastBlock.get().height)}
        return new Response({ data: { reward: 0 }});
    }

    @GET('/supply') // /getSupply
    public getSupply(): Response<{ supply: number }> {
        return new Response({ data: { supply: this.roundService.calcSupply(BlockService.getLastBlock().height) }});
    }
}
