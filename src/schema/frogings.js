

module.exports = {
	
	
	addTransactionForFreeze: {
		id: 'frogings.addTransactionForFreeze',
		type: 'object',
		properties: {
			secret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			},
			freezedAmount: {
				type: 'integer'
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
		required: ['secret','freezedAmount']
	},
	getAllFreezeOrder: {
		id: 'frogings.getAllFreezeOrder',
		type: 'object',
		properties: {
			secret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			}
		},
		required: ['secret']
	},
	getMyDDKFrozen: {
		id: 'frogings.getAllMyDDKFrozen',
		type: 'object',
		properties: {
			secret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			}
		},
		required: ['secret']
	},
	getAllActiveFreezeOrder: {
		id: 'frogings.getAllActiveFreezeOrder',
		type: 'object',
		properties: {
			secret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			}
		},
		required: ['secret']
	}

};
