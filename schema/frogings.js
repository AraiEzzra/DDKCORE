'use strict';

var constants = require('../helpers/constants.js');

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
			
			publicKey: {
				type: 'string',
				format: 'publicKey'
			},
			secondSecret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
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
