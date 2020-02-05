import { VoteType } from 'ddk.registry/dist/model/common/type';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_DELEGATES = [
    {
        id: API_ACTION_TYPES.CREATE_STAKE_ASSET,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            amount: {
                type: 'integer',
                minimum: 100000000,
                maximum: 4500000000000000
            },
        },
        required: ['address', 'amount'],
    },
    {
        id: API_ACTION_TYPES.CREATE_VOTE_ASSET,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
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
            },
        },
        required: ['address', 'votes', 'type'],
    },
];
