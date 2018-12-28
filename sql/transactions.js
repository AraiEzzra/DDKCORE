

let TransactionsSql = {
	sortFields: [
		'id',
		'blockId',
		'amount',
		'fee',
		'type',
		'timestamp',
		'senderPublicKey',
		'senderId',
		'recipientId',
		'confirmations',
		'height'
	],

	count: 'SELECT COUNT("id")::int AS "count" FROM trs',

	getTransactionHistory : 'SELECT serie.day AS "time", COUNT(t."timestamp") AS count, SUM(t."amount" + t."stakedAmount") AS "amount" FROM ( SELECT date_series::date AS "day" FROM generate_series(to_timestamp(${startTimestamp})::date,to_timestamp(${endTimestamp})::date, \'1 day\') AS "date_series") AS "serie" LEFT JOIN trs t ON (t."timestamp"+${epochTime})::abstime::date = serie.day::date GROUP  BY serie.day order by time',

	countById: 'SELECT COUNT("id")::int AS "count" FROM trs WHERE "id" = ${id}',

	countList: function (params) {
		return [
			'SELECT COUNT(1) FROM full_trs_list',
			(params.where.length || params.owner ? 'WHERE' : ''),
			(params.where.length ? '(' + params.where.join(' ') + ')' : ''),
			// FIXME: Backward compatibility, should be removed after transitional period
			(params.where.length && params.owner ? ' AND ' + params.owner : params.owner)
		].filter(Boolean).join(' ');
	},

	list: function (params) {
		return [
			'SELECT * FROM full_trs_list',
			(params.where.length || params.owner ? 'WHERE' : ''),
			(params.where.length ? '(' + params.where.join(' ') + ')' : ''),
			// FIXME: Backward compatibility, should be removed after transitional period
			(params.where.length && params.owner ? ' AND ' + params.owner : params.owner),
			(params.sortField ? 'ORDER BY ' + [params.sortField, params.sortMethod].join(' ') : ''),
			'LIMIT ${limit} OFFSET ${offset}'
		].filter(Boolean).join(' ');
	},

	getById: 'SELECT *, ENCODE ("t_senderPublicKey", \'hex\') AS "t_senderPublicKey", ENCODE ("m_recipientPublicKey", \'hex\') AS "m_recipientPublicKey" FROM trs_list WHERE "t_id" = ${id}',

	getVotesById: 'SELECT * FROM votes WHERE "transactionId" = ${id}',

	getUserNames: 'SELECT * from users_list'
};

module.exports = TransactionsSql;
