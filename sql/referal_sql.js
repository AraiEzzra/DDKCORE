'use strict';

let Referals = {

    updateReferLink : 'UPDATE mem_accounts SET "referralLink" = ${referralLink} WHERE "address" = ${address}',
    
    referLevelChain : 'SELECT level from referals WHERE "address" = ${address}',
    
    checkBalance : 'SELECT u_balance from mem_accounts WHERE "address" = ${sender_address}',
    
    insertLevelChain : 'INSERT INTO referals ("address","level") VALUES (${address},${level})',
    
    getDirectSponsor : 'SELECT address from referals WHERE level[1] = ${address}',
    
    insertMemberAccount : 'INSERT INTO mem_accounts ("address","u_isDelegate","isDelegate","publicKey","balance","u_balance","totalFrozeAmount","group_bonus") values (${address},${u_isDelegate},${isDelegate},${publicKey},${balance},${u_balance},${totalFrozeAmount},${group_bonus})',
    
    selectEtpsList : 'SELECT * from etps_user',
    
    insertMigratedUsers : 'INSERT INTO migrated_etps_users ("address","passphrase","publickey","username","id","group_bonus") VALUES (${address},${passphrase},${publickey},${username},${id},${group_bonus})',
    
    getDirectIntroducer : 'SELECT address,COUNT(*) As username from migrated_etps_users WHERE username = $1 GROUP BY address',
    
    insertReferalChain : 'INSERT INTO referals ("address","level") VALUES (${address},${level})',
    
    getMigratedUsers : 'SELECT * from migrated_etps_users',
    
    getStakeOrders :  'SELECT * from existing_etps_assets_m WHERE account_id = $1',
    
    insertStakeOrder : 'INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","recipientId","freezedAmount","rewardCount","nextVoteMilestone") VALUES (${id},${status},${startTime},${insertTime},${senderId},${recipientId},${freezedAmount},${rewardCount},${nextVoteMilestone})'
}

module.exports = Referals;
