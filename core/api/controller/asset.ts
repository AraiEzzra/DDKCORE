import { ResponseEntity } from 'eska-common/dist/socket/model/response';
import { PublicKey, VoteType, RawAsset } from 'ddk.registry/dist/model/common/type';
import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { API } from 'core/api/util/decorators';
import TransactionVoteService from 'core/service/transaction/vote';
import TransactionStakeService from 'core/service/transaction/stake';
import TransactionStakeRepository from 'shared/repository/transaction/asset/stake';
import TransactionVoteRepository from 'shared/repository/transaction/asset/vote';

export class AssetController {
    constructor() {
        this.createStakeAsset = this.createStakeAsset.bind(this);
        this.createVoteAsset = this.createVoteAsset.bind(this);
    }

    @API(API_ACTION_TYPES.CREATE_STAKE_ASSET)
    createStakeAsset(message: Message<{ address: string, amount: number }>): ResponseEntity<RawAsset> {
        const { amount, address } = message.body;
        const trs = {
            senderAddress: BigInt(address),
            asset: { amount },
        } as any;
        const asset = TransactionStakeService.create(trs);

        return new ResponseEntity({ data: TransactionStakeRepository.serialize(asset) });
    }

    @API(API_ACTION_TYPES.CREATE_VOTE_ASSET)
    createVoteAsset(
        message: Message<{ address: string, votes: Array<PublicKey>, type: VoteType }>,
    ): ResponseEntity<RawAsset> {
        const { votes, type, address } = message.body;
        const trs = {
            senderAddress: BigInt(address),
            asset: { votes, type },
        } as any;
        const asset = TransactionVoteService.create(trs);

        return new ResponseEntity({ data: TransactionVoteRepository.serialize(asset) });
    }
}

export default new AssetController();
