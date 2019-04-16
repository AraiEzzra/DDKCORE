import { TransactionType } from 'shared/model/transaction';

export const ASSET_PREPARED_TRS_STAKE = [
    {
        id: `ASSET_PREPARED.${TransactionType.STAKE}`,
        type: 'object',
        properties: {
            amount: {
                type: 'integer',
                minimum: 100000000,
                maximum: 4500000000000000
            },
            startTime: {
                type: 'integer'
            },
            startVoteCount: {
                type: 'integer'
            },
            airdropReward: {
                $ref: 'AIRDROP_REWARD'
            }
        },
        required: ['amount', 'startTime', 'startVoteCount', 'airdropReward']
    }
];
