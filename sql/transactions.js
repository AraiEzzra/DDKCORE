

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

	count: 'SELECT count(1) AS "count" FROM trs',

	getTransactionHistory : 'SELECT serie.day AS "time", COUNT(t."timestamp") AS count, SUM(t."amount" + t."stakedAmount") AS "amount" FROM ( SELECT date_series::date AS "day" FROM generate_series(to_timestamp(${startTimestamp})::date,to_timestamp(${endTimestamp})::date, \'1 day\') AS "date_series") AS "serie" LEFT JOIN trs t ON (t."timestamp"+${epochTime})::abstime::date = serie.day::date GROUP  BY serie.day order by time',

	countById: 'SELECT COUNT("id")::int AS "count" FROM trs WHERE "id" = ${id}',


	list: function (params) {
		return [
			'SELECT ' +
			't.id AS t_id,' +
            't."blockId" AS "t_blockId",' +
            't."rowId" AS "t_rowId",' +
            't.type AS t_type,' +
            't."timestamp" AS t_timestamp,' +
            't."trsName" AS "t_trsName",' +
            'encode(t."senderPublicKey", \'hex\'::text) AS "t_senderPublicKey",' +
            't."senderId" AS "t_senderId",' +
            't."recipientId" AS "t_recipientId",' +
            't.amount AS t_amount,' +
            't.fee AS t_fee,' +
            't.reward AS t_reward,' +
            'encode(t.signature, \'hex\'::text) AS t_signature,' +
            'encode(t."signSignature", \'hex\'::text) AS "t_signSignature",' +
            't."stakedAmount" AS "t_stakedAmount",' +
            't."stakeId" AS "t_stakeId",' +
            't."groupBonus" AS "t_groupBonus",' +
            't."pendingGroupBonus" AS "t_pendingGroupBonus",' +
            'encode(t."requesterPublicKey", \'hex\'::text) AS "t_requesterPublicKey",' +
            't.signatures AS t_signatures,' +
            't.salt AS t_salt,' +
            'b.height AS b_height,' +
            'v.votes AS v_votes,' +
            'v.reward AS v_reward,' +
            'v.unstake AS v_unstake,' +
            'v."airdropReward" AS "v_airdropReward",' +
            'so.id AS so_id,' +
            'so.status AS so_status,' +
            'so."startTime" AS "so_startTime",' +
            'so."insertTime" AS "so_insertTime",' +
            'so."senderId" AS "so_senderId",' +
            'so."recipientId" AS "so_recipientId",' +
            'so."freezedAmount" AS "so_freezedAmount",' +
            'so."nextVoteMilestone" AS "so_nextVoteMilestone",' +
            'so."airdropReward" AS "so_airdropReward",' +
            'ref.level AS ref_level,' +
			'count(1) OVER() as total_rows' +
			' FROM ' +
			' trs t' +
            ' LEFT JOIN blocks b ON t."blockId" = b.id' +
            ' LEFT JOIN votes v ON v."transactionId" = t.id' +
            ' LEFT JOIN stake_orders so ON so.id = t.id' +
            ' LEFT JOIN referals ref ON ref.address = t."senderId"',
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

	getDelegateNames: 'SELECT username as m_username, address as m_address from mem_accounts where mem_accounts."isDelegate" = 1',

	getTransactionById: 'SELECT * from trs WHERE "id" = ${id}'
};

module.exports = TransactionsSql;
