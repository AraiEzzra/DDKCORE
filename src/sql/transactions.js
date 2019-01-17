const TransactionsSql = {
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
        'confirmations'
],

    count: 'SELECT count(1) AS "count" FROM trs',

    getTransactionHistory : 'WITH transactions AS (' +
        '    SELECT' +
        '      t.truncated_date AS time,' +
        '      count(1)         AS count,' +
        '      sum(t."amount")  AS "amount"' +
        '    FROM (' +
        '           SELECT' +
        '             (trs."timestamp" + ${epochTime}) :: ABSTIME :: DATE AS truncated_date,' +
        '             trs."amount" + trs."stakedAmount"                   AS amount' +
        '           FROM trs' +
        '           WHERE trs.timestamp BETWEEN ${startTimestamp} - ${epochTime}' +
        '                 AND ${endTimestamp} - ${epochTime}' +
        '         ) t' +
        '    GROUP BY t.truncated_date' +
        ')' +
        'SELECT' +
        ' day_series AS time,' +
        ' coalesce(count,0) AS count,' +
        ' amount' +
        ' FROM generate_series(' +
        '         to_timestamp(${startTimestamp}) :: ABSTIME :: DATE,' +
        '         (to_timestamp(${endTimestamp}) + INTERVAL \'1 day\') :: ABSTIME :: DATE,' +
        '         \'1 day\'' +
        '     ) AS day_series' +
        ' LEFT JOIN transactions ON day_series = transactions.time' +
        ' ORDER BY time;',

    countById: 'SELECT COUNT("id")::int AS "count" FROM trs WHERE "id" = ${id}',


    list(params) {
        return [
            `${'WITH t0 AS (' +
            '    SELECT'}${
                params.where.length ? ' count(1) OVER () AS total_rows,' : ''}`,
            `${'      t.id                                          AS t_id,' +
            '      t."blockId"                                   AS "t_blockId",' +
            '      t."rowId"                                     AS "t_rowId",' +
            '      t.type                                        AS "t_type",' +
            '      t."timestamp"                                 AS "t_timestamp",' +
            '      t."trsName"                                   AS "t_trsName",' +
            '      encode(t."senderPublicKey", \'hex\' :: TEXT)    AS "t_senderPublicKey",' +
            '      t."senderId"                                  AS "t_senderId",' +
            '      t."recipientId"                               AS "t_recipientId",' +
            '      t.amount                                      AS "t_amount",' +
            '      t.fee                                         AS t_fee,' +
            '      t.reward                                      AS t_reward,' +
            '      encode(t.signature, \'hex\' :: TEXT)            AS t_signature,' +
            '      encode(t."signSignature", \'hex\' :: TEXT)      AS "t_signSignature",' +
            '      t."stakedAmount"                              AS "t_stakedAmount",' +
            '      t."stakeId"                                   AS "t_stakeId",' +
            '      t."groupBonus"                                AS "t_groupBonus",' +
            '      t."pendingGroupBonus"                         AS "t_pendingGroupBonus",' +
            '      encode(t."requesterPublicKey", \'hex\' :: TEXT) AS "t_requesterPublicKey",' +
            '      t.signatures                                  AS t_signatures,' +
            '      t.salt                                        AS t_salt' +
            '    FROM trs t '}${
                params.where.length || params.owner ? 'WHERE' : ''}`,
            (params.where.length ? `(${params.where.join(' ')})` : ''),
            // FIXME: Backward compatibility, should be removed after transitional period
            (params.where.length && params.owner ? ` AND ${params.owner}` : params.owner),
            (params.sortField ? `ORDER BY ${[params.sortField, params.sortMethod].join(' ')}` : ''),
            ' LIMIT ${limit} ' +
            ' OFFSET ${offset}' +
            ')',
            ' SELECT' +
            '  t.*,' +
            '  b.height               AS b_height,' +
            '  v.votes                AS v_votes,' +
            '  v.reward               AS v_reward,' +
            '  v.unstake              AS v_unstake,' +
            '  v."airdropReward"      AS "v_airdropReward",' +
            '  so.id                  AS so_id,' +
            '  so.status              AS so_status,' +
            '  so."startTime"         AS "so_startTime",' +
            '  so."insertTime"        AS "so_insertTime",' +
            '  so."senderId"          AS "so_senderId",' +
            '  so."recipientId"       AS "so_recipientId",' +
            '  so."freezedAmount"     AS "so_freezedAmount",' +
            '  so."nextVoteMilestone" AS "so_nextVoteMilestone",' +
            '  so."airdropReward"     AS "so_airdropReward",' +
            '  ref.level              AS ref_level' +
            '  FROM' +
            '  t0 t' +
            '  LEFT JOIN blocks b ON t."t_blockId" = b.id' +
            '  LEFT JOIN votes v ON v."transactionId" = t.t_id' +
            '  LEFT JOIN stake_orders so ON so.id = t.t_id' +
            '  LEFT JOIN referals ref ON ref.address = t."t_senderId" ' +
            (params.afterSortField ? `ORDER BY ${[params.afterSortField, params.sortMethod].join(' ')}` : ''),
        ].filter(Boolean).join(' ');
    },

    getById: 'SELECT *, ENCODE ("t_senderPublicKey", \'hex\') AS "t_senderPublicKey", ENCODE ("m_recipientPublicKey", \'hex\') AS "m_recipientPublicKey" FROM trs_list WHERE "t_id" = ${id}',

    getVotesById: 'SELECT * FROM votes WHERE "transactionId" = ${id}',

    getDelegateNames: 'SELECT username as m_username, address as m_address from mem_accounts where mem_accounts."isDelegate" = 1',

    getTransactionById: 'SELECT * from trs WHERE "id" = ${id}'
};

module.exports = TransactionsSql;
