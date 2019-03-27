import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_REWARD = [
    {
        id: API_ACTION_TYPES.GET_REWARD_HISTORY,
        type: 'object',
        properties: {
            address: {
                type: 'string'
            },
            filter: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number'
                    },
                    offset: {
                        type: 'number'
                    }
                },
                required: ['limit', 'offset']
            }
        },
        required: ['address', 'filter']
    },
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS_REWARDS,
        type: 'object',
        properties: {
            address: {
                type: 'string'
            },
            filter: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number'
                    },
                    offset: {
                        type: 'number'
                    }
                },
                required: ['limit', 'offset']
            }
        },
        required: ['address', 'filter']
    }
];
