'use strict';

let Referals = {

    sortFields: [
		'sponsor_address',
		'introducer_address',
		'reward',
		'sponsor_level',
		'transaction_type',
		'reward_time'
	],

    updateReferLink : 'UPDATE mem_accounts SET "referralLink" = ${referralLink} WHERE "address" = ${address}',
    
    referLevelChain : 'SELECT level from referals WHERE "address" = ${address}',
    
    checkBalance : 'SELECT u_balance from mem_accounts WHERE "address" = ${sender_address}',
    
    insertLevelChain : 'INSERT INTO referals ("address","level") VALUES (${address},${level})',
    
    getDirectSponsor : 'SELECT address from referals WHERE level[1] = ${address}',
        
    insertMemberAccount : 'UPDATE mem_accounts SET "totalFrozeAmount"=${totalFrozeAmount},"group_bonus"=${group_bonus},"pending_group_bonus"=${group_bonus} WHERE "address"= ${address}',

    selectEtpsList : 'SELECT * from etps_user where id > ${etpsCount} order by id asc',
    
    insertMigratedUsers : 'INSERT INTO migrated_etps_users ("address","passphrase","publickey","username","id","group_bonus") VALUES (${address},${passphrase},${publickey},${username},${id},${group_bonus})',
    
    getDirectIntroducer : 'SELECT address,COUNT(*) As username from migrated_etps_users WHERE username = $1 GROUP BY address',
    
    insertReferalChain : 'INSERT INTO referals ("address","level") VALUES (${address},${level})',
    
    getMigratedUsers : 'SELECT id,address,passphrase,publickey,group_bonus from migrated_etps_users where id > ${lastetpsId} order by id ASC',
    
    getStakeOrders :  'SELECT insert_time,quantity,remain_month from existing_etps_assets_m WHERE account_id = $1',
    
    insertStakeOrder : 'INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","recipientId","freezedAmount","rewardCount","voteCount","nextVoteMilestone") VALUES (${id},${status},${startTime},${insertTime},${senderId},${recipientId},${freezedAmount},${rewardCount},${voteCount},${nextVoteMilestone})',

    updateRewardTypeTransaction : 'INSERT INTO referral_transactions ("id","sponsor_address","introducer_address","reward","sponsor_level","transaction_type","reward_time") VALUES (${trsId},${sponsorAddress},${introducer_address},${reward},${level},${transaction_type},${time})',

    findReferralList : 'SELECT address from referals WHERE level[1] = ANY(ARRAY[${refer_list}])',

    findTotalStakeVolume : 'SELECT SUM("freezedAmount") as freezed_amount from stake_orders WHERE "senderId" = ANY(ARRAY[${address_list}]) AND "status" =1',

    findSponsorStakeStatus : 'SELECT "senderId",count(*)::int as status from stake_orders WHERE "senderId" = ANY(ARRAY[${sponsor_address}]) AND "status" = 1 GROUP BY "senderId"',

    etpsuserAmount: 'SELECT SUM(quantity) as amount from existing_etps_assets_m where account_id = ${account_id}',

    lastMigratedId: 'SELECT max(id), count(*) from migrated_etps_users',

    lastSendTrs: 'SELECT m."id" from trs t INNER JOIN migrated_etps_users m ON(t."recipientId" = m."address" AND t."trsName" = \'SEND_MIGRATION\') order by t.timestamp DESC LIMIT 1',

    lastMigrationTrs: 'SELECT m."id" from trs t INNER JOIN migrated_etps_users m ON(t."senderId" = m."address" AND t."trsName" = \'MIGRATION\') order by t.timestamp DESC LIMIT 1',

    countList: function (params) {
		return [
			'SELECT COUNT(1) FROM trs_refer',
			(params.where.length || params.owner ? 'WHERE' : ''),
			(params.where.length ? '(' + params.where.join(' ') + ')' : ''),
			(params.where.length && params.owner ? ' AND ' + params.owner : params.owner)
		].filter(Boolean).join(' ');
    },
    
    list: function (params) {
		return [
			'SELECT * FROM trs_refer',
			(params.where.length ? 'WHERE ' + params.where.join(' AND ') : ''),
			(params.sortField ? 'ORDER BY ' + [params.sortField, params.sortMethod].join(' ') : ''),
			'LIMIT ${limit} OFFSET ${offset}'
		].filter(Boolean).join(' ');
	}
}

module.exports = Referals;
