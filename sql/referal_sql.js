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
        
    insertMemberAccount : 'UPDATE mem_accounts SET "balance" = ${balance},"u_balance" = ${u_balance},"totalFrozeAmount"=${totalFrozeAmount},"group_bonus"=${group_bonus} WHERE "address"= ${address}',

    selectEtpsList : 'SELECT * from etps_user',
    
    insertMigratedUsers : 'INSERT INTO migrated_etps_users ("address","passphrase","publickey","username","id","group_bonus") VALUES (${address},${passphrase},${publickey},${username},${id},${group_bonus})',
    
    getDirectIntroducer : 'SELECT address,COUNT(*) As username from migrated_etps_users WHERE username = $1 GROUP BY address',
    
    insertReferalChain : 'INSERT INTO referals ("address","level") VALUES (${address},${level})',
    
    getMigratedUsers : 'SELECT id,address,passphrase,publickey,group_bonus from migrated_etps_users',
    
    getStakeOrders :  'SELECT insert_time,quantity,remain_month from existing_etps_assets_m WHERE account_id = $1',
    
    insertStakeOrder : 'INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","recipientId","freezedAmount","rewardCount","nextVoteMilestone") VALUES (${id},${status},${startTime},${insertTime},${senderId},${recipientId},${freezedAmount},${rewardCount},${nextVoteMilestone})',

    updateRewardTypeTransaction : 'INSERT INTO referral_transactions ("id","sponsor_address","introducer_address","reward","sponsor_level","transaction_type","reward_time") VALUES (${trsId},${sponsorAddress},${introducer_address},${reward},${level},${transaction_type},${time})',

    findReferralList : 'SELECT address from referals WHERE level[1] = ANY(ARRAY[${refer_list}])',

    findTotalStakeVolume : 'SELECT SUM("freezedAmount") as freezed_amount from stake_orders WHERE "senderId" = ANY(ARRAY[${address_list}]) AND "status" =1',

    findSponsorStakeStatus : 'SELECT "senderId",count(*)::int as status from stake_orders WHERE "senderId" = ANY(ARRAY[${sponsor_address}]) AND "status" = 1 GROUP BY "senderId"',

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
