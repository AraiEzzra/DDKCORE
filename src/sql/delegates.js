const pgp = require('pg-promise');

const DelegatesSql = {
    sortFields: [
        'username',
        'address',
        'publicKey',
        'vote',
        'missedblocks',
        'producedblocks',
        'approval',
        'productivity',
        'voters_cnt',
        'register_timestamp'
    ],

    count: 'SELECT COUNT(*)::int FROM delegates',

    search(params) {
        const sql = [
            'WITH',
            'supply AS (SELECT calcSupply((SELECT height FROM blocks ORDER BY height DESC LIMIT 1))::numeric),',
            'delegates AS (SELECT row_number() OVER (ORDER BY vote DESC, m."publicKey" ASC)::int AS rank,',
            'm.username,',
            'm.address,',
            'm."publicKey" AS "publicKey",',
            'm.vote,',
            'm.producedblocks,',
            'm.missedblocks,',
            'ROUND(vote / (SELECT * FROM supply) * 100, 2)::float AS approval,',
            '(CASE WHEN producedblocks + missedblocks = 0 THEN 0.00 ELSE',
            'ROUND(100 - (missedblocks::numeric / (producedblocks + missedblocks) * 100), 2)',
            'END)::float AS productivity,',
            'COALESCE(v.voters_cnt, 0) AS voters_cnt,',
            't.timestamp AS register_timestamp',
            'FROM delegates d',
            'LEFT JOIN mem_accounts m ON d.username = m.username',
            'LEFT JOIN trs t ON d."transactionId" = t.id',
            'LEFT JOIN (SELECT "dependentId", COUNT(1)::int AS voters_cnt from mem_accounts2delegates GROUP BY "dependentId") v ON v."dependentId" = m."publicKey"',
            'WHERE m."isDelegate" = 1',
            `ORDER BY ${[params.sortField, params.sortMethod].join(' ')})`,
            'SELECT * FROM delegates WHERE username LIKE ${q} LIMIT ${limit}'
        ].join(' ');

        params.q = `%${String(params.q).toLowerCase()}%`;
        return pgp.as.format(sql, params);
    },

    insertFork: 'INSERT INTO forks_stat ("delegatePublicKey", "blockTimestamp", "blockId", "blockHeight", "previousBlock", "cause") VALUES (${delegatePublicKey}, ${blockTimestamp}, ${blockId}, ${blockHeight}, ${previousBlock}, ${cause});',

    getVoters: 'SELECT accounts.address, accounts.balance, "publicKey" FROM mem_accounts2delegates delegates INNER JOIN mem_accounts accounts ON delegates."accountId" = accounts.address WHERE delegates."dependentId" = ${publicKey} ORDER BY accounts."balance" DESC LIMIT ${limit} OFFSET ${offset}',

    getVotersCount: 'SELECT count(*) FROM mem_accounts2delegates WHERE "dependentId" = ${publicKey}',

    getLatestVoters: 'SELECT * from trs WHERE type = 60 ORDER BY timestamp DESC LIMIT ${limit}',

    getLatestDelegates: 'SELECT d."username" AS "username", t."senderId" AS "address", t."senderPublicKey" AS "publicKey", t."timestamp" AS "timestamp" FROM trs t INNER JOIN delegates d ON t."id" = d."transactionId" WHERE t."type" = 30 ORDER BY "timestamp" DESC LIMIT ${limit}',

    addDelegateVoteRecord: 'INSERT INTO "delegate_to_vote_counter"("publicKey", "voteCount") VALUES (${publicKey}, 0) ON CONFLICT DO NOTHING',

    removeDelegateVoteRecord: 'DELETE FROM "delegate_to_vote_counter" WHERE "publicKey" = ${publicKey}',
    
    removeDelegates: 'DELETE FROM mem_accounts2delegates WHERE "accountId" = ${accountId} and "dependentId" in (${dependentIds}:csv)',

    removeUDelegates: 'DELETE FROM mem_accounts2u_delegates WHERE "accountId" = ${accountId} and "dependentId" in (${dependentIds}:csv)',

    getTopDelegates: 'SELECT' +
    '  "username",' +
    '  "address",' +
    '  delegate_to_vote_counter."publicKey",' +
    '  delegate_to_vote_counter."voteCount",' +
    '  "vote",' +
    '  "missedblocks",' +
    '  "producedblocks",' +
    '  "url"' +
    ' FROM delegate_to_vote_counter' +
    '  INNER JOIN mem_accounts on mem_accounts."publicKey" = delegate_to_vote_counter."publicKey"' +
    ' ORDER BY delegate_to_vote_counter."voteCount" DESC, "vote" DESC, delegate_to_vote_counter."publicKey";'
};

module.exports = DelegatesSql;
