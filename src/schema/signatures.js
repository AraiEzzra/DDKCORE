

module.exports = {
	addSignature: {
		id: 'signatures.addSignature',
		type: 'object',
		properties: {
			secret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			},
			secondSecret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			},
			multisigAccountPublicKey: {
				type: 'string',
				format: 'publicKey'
			}
		},
		required: ['secret', 'secondSecret']
	}
};
