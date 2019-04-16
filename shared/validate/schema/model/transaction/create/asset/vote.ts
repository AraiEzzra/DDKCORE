import { TransactionType, VoteType } from 'shared/model/transaction';

export const ASSET_TRS_VOTE = [
    {
        id: `ASSET.${TransactionType.VOTE}`,
        type: 'object',
        properties: {
            votes: {
                type: 'array',
                items: {
                    type: 'string',
                    format: 'publicKey'
                },
                maxItems: 3,
            },
            type: {
                type: 'string',
                enum: [
                    VoteType.VOTE,
                    VoteType.DOWN_VOTE
                ]
            }
        },
        required: ['votes', 'type']
    }
];
