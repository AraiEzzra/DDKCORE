import config from 'shared/config';

export const AIRDROP_REWARD = [
    {
        id: 'AIRDROP_REWARD',
        type: 'object',
        properties: {
            sponsors: {
                type: 'array',
                items: {
                    type: 'array',
                    items: [
                        {
                            type: 'string',
                            format: 'address'
                        },
                        {
                            type: 'number'
                        }
                    ]
                },
                minItems: 0,
                maxItems: config.CONSTANTS.REFERRAL.MAX_COUNT
            }
        },
        required: ['sponsors']
    }
];
