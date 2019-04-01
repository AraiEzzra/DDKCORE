import { TransactionType } from 'shared/model/transaction';

export const ASSET_TRS_SEND = [
    {
        id: `ASSET.${TransactionType.SEND}`,
        type: 'object',
        properties: {
            amount: {
                type: 'integer',
                minimum: 1,
                maximum: 4500000000000000
            },
            recipientAddress: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['amount', 'recipientAddress']
    },
];
