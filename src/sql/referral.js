const Referral = {

    sortFields: [
        'sponsor_address',
        'introducer_address',
        'reward',
        'sponsor_level',
        'transaction_type',
        'reward_time'
    ],

    changeAccountGlobalStatus: 'UPDATE mem_accounts SET global = ${status} WHERE address = ${address}',

    referLevelChain: 'SELECT level from referals WHERE "address" = ${address}',

    updateAccountBalance: 'UPDATE mem_accounts SET "balance" = "balance" + ${reward}, "u_balance" = "u_balance" + ${reward} WHERE "address" = ${address}',

    insertLevelChain: 'INSERT INTO referals ("address","level") VALUES (${address},${level}) ON CONFLICT DO NOTHING',

    updateRewardTypeTransaction: 'INSERT INTO referral_transactions ("id","sponsor_address","introducer_address","reward","sponsor_level","transaction_type","reward_time") VALUES (${trsId},${sponsorAddress},${introducer_address},${reward},${level},${transaction_type},${time})',

    deleteRewardTypeTransaction: 'DELETE FROM referral_transactions WHERE "id" = ${trsId}',

    findReferralList: 'WITH t0 as ( SELECT address, count(*) OVER () AS totalusers FROM referals WHERE level[${levelInfo}] = ${address} LIMIT ${limit} OFFSET ${offset} ) SELECT address, COALESCE(s."status",0) AS stakeStatus, COALESCE(SUM(s."freezedAmount"),0) as freezedAmount, totalusers FROM t0 r LEFT JOIN stake_orders s ON r."address" = s."senderId" AND s."status" = 1 GROUP BY r."address", totalusers, s."status"',

    findTotalStakeVolume: 'SELECT SUM("freezedAmount") as freezed_amount from stake_orders WHERE "senderId" = ANY(ARRAY[${address_list}]) AND "status" =1',

    findSponsorStakeStatus: 'SELECT "senderId",count(*)::int as status from stake_orders WHERE "senderId" = ANY(ARRAY[${sponsor_address}]) AND "status" = 1 GROUP BY "senderId"',

    getReferralRewardHistory: 'SELECT *, count(*) OVER() AS rewards_count from trs_refer WHERE "introducer_address"=${introducer_address} ORDER BY "reward_time" DESC LIMIT ${limit} OFFSET ${offset}'
};

module.exports = Referral;
