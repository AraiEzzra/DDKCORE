export default {
    id: 'Block',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'hex',
            minLength: 1,
            maxLength: 64
        },
        height: {
            type: 'integer',
            minimum: 1
        },
        signature: {
            type: 'string',
            format: 'signature'
        },
        generatorPublicKey: {
            type: 'string',
            format: 'publicKey'
        },
        transactionCount: {
            type: 'integer'
        },
        payloadHash: {
            type: 'string',
            format: 'hex'
        },
        previousBlockId: {
            type: 'string',
            format: 'hex',
            minLength: 1,
            maxLength: 64
        },
        createdAt: {
            type: 'integer'
        },
        amount: {
            type: 'integer',
            minimum: 0
        },
        fee: {
            type: 'integer',
            minimum: 0
        },
        transactions: {
            type: 'array',
            uniqueItems: true
        },
        version: {
            type: 'integer',
            minimum: 0
        }
    },
    required: [
        'id',
        'height',
        'signature',
        'generatorPublicKey',
        'transactionCount',
        'payloadHash',
        'previousBlockId',
        'createdAt',
        'amount',
        'fee',
        'version'
    ]
};
