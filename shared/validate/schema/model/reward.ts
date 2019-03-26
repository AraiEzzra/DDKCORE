import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

const GET_REWARD_HISTORY = {
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
};

const GET_REFERRED_USERS_REWARDS = {
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
};

export const SCHEMAS_GET_REWARD = [].concat(
    GET_REWARD_HISTORY,
    GET_REFERRED_USERS_REWARDS
);
