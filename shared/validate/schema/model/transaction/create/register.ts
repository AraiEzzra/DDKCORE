import { TransactionType } from 'shared/model/transaction';

export const ASSET_TRS_REGISTER = [
    {
        id: `ASSET.${TransactionType.REGISTER}`,
        type: 'object',
        properties: {
            referral: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['referral']
    }
];
