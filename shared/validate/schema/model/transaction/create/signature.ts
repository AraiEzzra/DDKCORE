import { TransactionType } from 'shared/model/transaction';

export const ASSET_TRS_SIGNATURE = [
    {
        id: `ASSET.${TransactionType.SIGNATURE}`,
        type: 'object',
        properties: {
            publicKey: {
                type: 'string',
                format: 'publicKey'
            }
        },
        required: ['publicKey']
    }
];
