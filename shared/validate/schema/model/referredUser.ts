import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import config from 'shared/config';

export const SCHEMA_REFERRED_USERS = [
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            level: {
                type: 'number',
                minimum: 0,
                maximum: config.CONSTANTS.REFERRAL.MAX_COUNT
            }
        },
        required: ['address', 'level']
    }
];
