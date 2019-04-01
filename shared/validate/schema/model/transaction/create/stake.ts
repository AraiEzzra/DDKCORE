import { TransactionType } from 'shared/model/transaction';

export const ASSET_TRS_STAKE = [
    {
        id: `ASSET.${TransactionType.STAKE}`,
        type: 'object',
        properties: {
            amount: {
                type: 'integer',
                minimum: 1,
                maximum: 4500000000000000
            },
        },
        required: ['amount']
    }
];
