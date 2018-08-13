

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
				maxLength: 25
			},
			stakeId :{
				type : 'integer',

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
