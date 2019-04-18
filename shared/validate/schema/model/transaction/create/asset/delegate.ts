import { TransactionType } from 'shared/model/transaction';

export const ASSET_TRS_DELEGATE = [
    {
        id: `ASSET.${TransactionType.DELEGATE}`,
        type: 'object',
        properties: {
            username: {
                type: 'string',
                format: 'username'
            }
        },
        required: ['username']
    },
];
