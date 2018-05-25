'use strict';

var constants = require('../helpers/constants.js');

module.exports = {
	
	
	transferFreezeOrder: {
		id: 'sendFreezeOrder.transferFreezeOrder',
		type: 'object',
		properties: {
			secret: {
				type: 'string',
				minLength: 1,
				maxLength: 100
			},
			recipientId: {
				type: 'string',
				format: 'address',
				minLength: 1,
				maxLength: 22
            },
            stakeId :{
                type : 'integer',

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
		required: ['secret','recipientId','stakeId']
	}
};
