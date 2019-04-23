import { ASSET_TRS_SEND } from 'shared/validate/schema/model/transaction/create/asset/send';
import { ASSET_TRS_REGISTER } from 'shared/validate/schema/model/transaction/create/asset/register';
import { ASSET_TRS_SIGNATURE } from 'shared/validate/schema/model/transaction/create/asset/signature';
import { ASSET_TRS_DELEGATE } from 'shared/validate/schema/model/transaction/create/asset/delegate';
import { ASSET_TRS_STAKE } from 'shared/validate/schema/model/transaction/create/asset/stake';
import { ASSET_TRS_VOTE } from 'shared/validate/schema/model/transaction/create/asset/vote';
import { TransactionType } from 'shared/model/transaction';
import { ALLOWED_TRANSACTION_TYPES_ARRAY } from 'shared/validate/schema/common';

const createTrsScheme = (type: number) => ({
    id: `CREATE_TRANSACTION.${type}`,
    type: 'object',
    properties: {
        trs: {
            type: 'object',
            properties: {
                type: {
                    type: 'integer',
                    enum: ALLOWED_TRANSACTION_TYPES_ARRAY
                },
                senderPublicKey: {
                    type: 'string',
                    format: 'publicKey'
                },
                asset: {
                    $ref: `ASSET.${type}`
                }
            },
            required: ['type', 'senderPublicKey', 'asset']
        },
        secret: {
            type: 'string',
            format: 'secret'
        },
        secondSecret: {
            type: 'string',
            format: 'secret'
        }
    },
    required: ['trs', 'secret']
});

export const CREATE_TRS_SCHEMAS = [
    [ASSET_TRS_REGISTER, createTrsScheme(TransactionType.REGISTER)],
    [ASSET_TRS_SEND, createTrsScheme(TransactionType.SEND)],
    [ASSET_TRS_SIGNATURE, createTrsScheme(TransactionType.SIGNATURE)],
    [ASSET_TRS_DELEGATE, createTrsScheme(TransactionType.DELEGATE)],
    [ASSET_TRS_STAKE, createTrsScheme(TransactionType.STAKE)],
    [ASSET_TRS_VOTE, createTrsScheme(TransactionType.VOTE)],
];
