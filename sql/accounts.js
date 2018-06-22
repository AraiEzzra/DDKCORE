

let Accounts = {

	checkAccountStatus : 'SELECT "status" FROM mem_accounts where "address"=${senderId}',

	findActiveStakeAmount: 'SELECT SUM("freezedAmount") FROM stake_orders WHERE "senderId" = ${senderId} AND "status" = 1',

	findActiveStake: 'SELECT * FROM stake_orders WHERE "senderId" = ${senderId} AND "status" = 1',
  
	findGroupBonus: 'SELECT "group_bonus", "pending_group_bonus" FROM mem_accounts WHERE "address"=${senderId}',

	findDirectSponsor: 'SELECT * FROM mem_accounts WHERE "introducer" = ${introducer}',

	updatePendingGroupBonus: 'UPDATE mem_accounts SET "pending_group_bonus" = "pending_group_bonus" + ${nextBonus} WHERE "address"=${senderId}',

	disableAccount : 'UPDATE mem_accounts SET "status" = 0 WHERE "address" = ${senderId}',

	enableAccount : 'UPDATE mem_accounts SET "status" = 1 WHERE "address" = ${senderId}',

	getTotalAccount : 'SELECT count("address") FROM mem_accounts WHERE "balance" > 0',

	getCurrentUnmined : 'SELECT "balance" FROM mem_accounts where "address"=${address}',

	checkAlreadyMigrated : 'SELECT "isMigrated" FROM mem_accounts where "name"=${username}',
  
	updateUserInfo : 'UPDATE mem_accounts SET "balance" = ${balance},"u_balance"=${balance},"email" = ${email}, "phoneNumber" = ${phone}, "country" = ${country}, "name" = ${username}, "totalFrozeAmount"=${totalFrozeAmount}, "isMigrated" = 1, "group_bonus" = ${group_bonus} WHERE "address" = ${address}',

	validateExistingUser: 'SELECT * FROM etps_user  WHERE  "username"=${username} AND "password"=${password}',

	findTrsUser: 'SELECT * FROM trs WHERE "senderId" = ${senderId}',

	findTrs: 'SELECT * FROM trs WHERE "id" = ${transactionId}',

	InsertStakeOrder: 'INSERT INTO stake_orders ("id", "status", "startTime", "insertTime", "senderId", "freezedAmount", "rewardCount", "nextVoteMilestone") VALUES (${account_id},${status},${startTime},${insertTime},${senderId},${freezedAmount},${rewardCount},${nextVoteMilestone}) ',

	getETPSStakeOrders: 'SELECT * FROM existing_etps_assets WHERE "account_id"=${account_id} AND "status"=0 AND "month_count" < 6',

	totalFrozeAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "id"=${account_id} and "status"=1',

	updateStakeOrder: 'UPDATE stake_orders SET "isVoteDone"= true , "voteCount"="voteCount"+1 WHERE "senderId"=${senderId} AND "status"=1 AND "isVoteDone" <> true',

	checkWeeklyVote: 'SELECT count(*) FROM stake_orders WHERE "senderId"=${senderId} AND "status"=1 AND "isVoteDone"=false',

    updateETPSUserInfo: 'UPDATE etps_user SET "transferred_time"=${insertTime}, "transferred_etp"=1 WHERE "id"=${userId} ',

	findReferLink : 'SELECT count(*) AS address FROM mem_accounts WHERE "referralLink" = ${referLink}'
};

module.exports = Accounts;
