import { TransactionType } from 'shared/model/transaction';

export const ASSET_PREPARED_TRS_VOTE = [
    {
        id: `ASSET_PREPARED.${TransactionType.VOTE}`,
        type: 'object',
        properties: {
            votes: {
                type: 'array',
                items: {
                    type: 'string',
                    format: 'vote'
                },
                minItems: 1,
                maxItems: 3
            },
            reward: {
                type: 'integer'
            },
            unstake: {
                type: 'integer'
            },
            airdropReward: {
                $ref: 'AIRDROP_REWARD'
            }
        },
        required: ['votes', 'reward', 'unstake', 'airdropReward']
    }
];

