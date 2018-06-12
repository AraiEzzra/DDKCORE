

var FrogingsSql = {
	sortFields: [
		'id',
		'status',
		'startTime',
		'insertTime',
		'senderId',
		'recipientId',
		'freezedAmount',
		'rewardCount',
		'voteCount',
		'nextVoteMilestone',
		'isVoteDone',
		'isTransferred'
	],

	count: 'SELECT COUNT("id")::int AS "count" FROM stake_orders',

	getMemoryAccounts: 'SELECT * FROM  mem_accounts',

	updateFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${freezedAmount}) WHERE "address" = ${senderId}',

	getFrozeAmount: 'SELECT "totalFrozeAmount" FROM mem_accounts WHERE "address"=${senderId}',

	disableFrozeOrders: 'UPDATE stake_orders SET "status"=0, "nextVoteMilestone"=-1 where "status"=1 AND ${totalMilestone} = "rewardCount"',

	checkAndUpdateMilestone: 'UPDATE stake_orders SET "nextVoteMilestone"= ("nextVoteMilestone" +${milestone}), "isVoteDone"= false where "status"=1 AND  ${currentTime} >= "nextVoteMilestone" ',

	getfrozeOrder: 'SELECT "senderId" , "freezedAmount", "rewardCount", "nextVoteMilestone", "voteCount" FROM stake_orders WHERE "status"=1 AND ${currentTime} >= "nextVoteMilestone" ',

	deductFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" - ${FrozeAmount}) WHERE "address" = ${senderId}',

	getFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId}',

	getActiveFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "status"=1',

	getActiveFrozeOrder: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "stakeId"=${stakeId} AND "status"=1',

	updateFrozeOrder: 'UPDATE stake_orders SET "status"=0,"recipientId"=${recipientId}, "nextVoteMilestone"=-1 WHERE "senderId"=${senderId} AND "stakeId"=${stakeId} AND "status"=1',

	createNewFrozeOrder: 'INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","freezedAmount","rewardCount","voteCount","nextVoteMilestone","isVoteDone","isTransferred") VALUES (${id},1,${startTime},${insertTime},${senderId},${freezedAmount},${rewardCount},${voteCount},${nextVoteMilestone},${isVoteDone},true) ',

	countStakeholders: 'SELECT count(DISTINCT "senderId") FROM stake_orders WHERE "status"=1',

	getTotalStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "status"=1',

	getMyStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "senderId"=${address} AND "status"=1',

	updateOrder: 'UPDATE stake_orders SET "rewardCount" = ("rewardCount" + 1), "voteCount"=0, "isVoteDone"=false WHERE "senderId" = ${senderId}',

	checkRewardCount: 'SELECT "rewardCount" FROM stake_orders WHERE "status"=1 AND "senderId"=${senderId}'

};

module.exports = FrogingsSql;
