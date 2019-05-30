import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMA_AIRDROP_REWARD_HISTORY = [
    {
        id: API_ACTION_TYPES.GET_AIRDROP_REWARD_HISTORY,
        type: 'object',
        properties: {
            referralAddress: {
                type: 'string',
                format: 'address'
            },
            startTime: {
                type: 'number'
            },
            endTime: {
                type: 'number'
            }
        },
        required: ['referralAddress', 'startTime', 'endTime']
    },
    {
        id: API_ACTION_TYPES.GET_AIRDROP_REWARD_DAILY_HISTORY,
        type: 'object',
        properties: {
            referralAddress: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['referralAddress']
    }
];
