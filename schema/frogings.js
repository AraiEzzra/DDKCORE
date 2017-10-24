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
			amount: {
				type: 'integer',
				minimum: 1,
				maximum: constants.totalAmount
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
		required: ['secret']
	}
};
