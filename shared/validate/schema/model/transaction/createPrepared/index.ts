import { ASSET_PREPARED_TRS_SEND } from 'shared/validate/schema/model/transaction/createPrepared/asset/send';
import { ASSET_PREPARED_TRS_REGISTER } from 'shared/validate/schema/model/transaction/createPrepared/asset/register';
import { ASSET_PREPARED_TRS_SIGNATURE } from 'shared/validate/schema/model/transaction/createPrepared/asset/signature';
import { ASSET_PREPARED_TRS_DELEGATE } from 'shared/validate/schema/model/transaction/createPrepared/asset/delegate';
import { ASSET_PREPARED_TRS_STAKE } from 'shared/validate/schema/model/transaction/createPrepared/asset/stake';
import { ASSET_PREPARED_TRS_VOTE } from 'shared/validate/schema/model/transaction/createPrepared/asset/vote';
import { AIRDROP_REWARD } from 'shared/validate/schema/model/transaction/createPrepared/airdropReward';
import { TransactionType } from 'shared/model/transaction';
import { ALLOWED_TRANSACTION_TYPES_ARRAY } from 'shared/validate/schema/common';

const createPreparedTrsScheme = (type: number) => ({
    id: `CREATE_PREPARED_TRANSACTION.${type}`,
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'id'
        },
        signature: {
            type: 'string',
            format: 'hex'
        },
        secondSignature: {
            type: 'string',
            format: 'hex'
        },
        type: {
            type: 'integer',
            enum: ALLOWED_TRANSACTION_TYPES_ARRAY
        },
        fee: {
            type: 'integer'
        },
        salt: {
            type: 'string',
            format: 'hex'
        },
        senderAddress: {
            type: 'string',
            format: 'address'
        },
        senderPublicKey: {
            type: 'string',
            format: 'publicKey'
        },
        createdAt: {
            type: 'integer'
        },
        asset: {
            $ref: `ASSET_PREPARED.${type}`
        }
    },
    required: ['id', 'signature', 'type', 'fee', 'salt', 'senderAddress', 'senderPublicKey', 'createdAt', 'asset']
});

export const CREATE_PREPARED_TRS_SCHEMAS = [
    AIRDROP_REWARD,
    [ASSET_PREPARED_TRS_REGISTER, createPreparedTrsScheme(TransactionType.REGISTER)],
    [ASSET_PREPARED_TRS_SEND, createPreparedTrsScheme(TransactionType.SEND)],
    [ASSET_PREPARED_TRS_SIGNATURE, createPreparedTrsScheme(TransactionType.SIGNATURE)],
    [ASSET_PREPARED_TRS_DELEGATE, createPreparedTrsScheme(TransactionType.DELEGATE)],
    [ASSET_PREPARED_TRS_STAKE, createPreparedTrsScheme(TransactionType.STAKE)],
    [ASSET_PREPARED_TRS_VOTE, createPreparedTrsScheme(TransactionType.VOTE)],
];


