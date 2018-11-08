

let FrogingsSql = {
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

	updateAccountBalanceAndFroze: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${reward}), "balance"=("balance" + ${reward}), "u_balance"=("u_balance" + ${reward}) WHERE "address"=${senderId}',

    undoUpdateAccountBalanceAndFroze: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" - ${reward}), "balance"=("balance" - ${reward}), "u_balance"=("u_balance" - ${reward}) WHERE "address"=${senderId}',

	getMemoryAccounts: 'SELECT * FROM  mem_accounts',

	updateFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${reward}) WHERE "address" = ${senderId}',

	getFrozeAmount: 'SELECT "totalFrozeAmount" FROM mem_accounts WHERE "address"=${senderId}',

	disableFrozeOrders: 'UPDATE stake_orders SET "status"=0, "nextVoteMilestone"=-1 where "stakeId"=${stakeId}',

	enableFrozeOrders: 'UPDATE stake_orders SET "status"=1, "nextVoteMilestone"=+1 where "stakeId"=${stakeId}',

	checkAndUpdateMilestone: 'UPDATE stake_orders SET "nextVoteMilestone"= ("nextVoteMilestone" +${milestone}), "isVoteDone"= false where "status"=1 AND  ${currentTime} >= "nextVoteMilestone" ',

	getfrozeOrder: 'SELECT "senderId" , "freezedAmount", "rewardCount", "nextVoteMilestone", "voteCount", "stakeId" FROM stake_orders WHERE "status"=1 AND ${currentTime} >= "nextVoteMilestone" ',

	deductFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" - ${orderFreezedAmount}) WHERE "address" = ${senderId}',

    stakeFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${orderFreezedAmount}) WHERE "address" = ${senderId}',

	getFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId}',

	getActiveFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "status"=1 AND ${currentTime} >= "nextVoteMilestone"',

    getInactiveFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "status"=0 AND ${currentTime} >= "nextVoteMilestone"',

	getActiveFrozeOrder: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "id"=${stakeId} AND "status"=1',

	updateFrozeOrder: 'UPDATE stake_orders SET "status"=0,"recipientId"=${recipientId}, "nextVoteMilestone"=-1, "transferCount" = ("transferCount"+1) WHERE "senderId"=${senderId} AND "id"=${stakeId} AND "status"=1',

	createNewFrozeOrder: 'INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","freezedAmount","rewardCount","voteCount","nextVoteMilestone","isVoteDone","transferCount") VALUES (${id},1,${startTime},${insertTime},${senderId},${freezedAmount},${rewardCount},${voteCount},${nextVoteMilestone},${isVoteDone},$(transferCount)+1) ',

	countStakeholders: 'SELECT count(DISTINCT "senderId") FROM stake_orders WHERE "status"=1',

	getTotalStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "status"=1',

	getMyStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "senderId"=${address} AND "status"=1',

	updateOrder: 'UPDATE stake_orders SET "rewardCount" = ("rewardCount" + 1), "voteCount"=0, "isVoteDone"=false WHERE "senderId" = ${senderId} AND "stakeId"=${id}',

	checkRewardCount: 'SELECT "rewardCount" FROM stake_orders WHERE "status"=1 AND "senderId"=${senderId}',

	getSelectedOrder: 'SELECT "senderId" , "freezedAmount", "rewardCount", "nextVoteMilestone", "voteCount", "stakeId" FROM stake_orders WHERE "status"=1 AND "stakeId"=${id}',

	RemoveOrder: 'DELETE FROM stake_orders WHERE "id" = ${id} AND "senderId"=${address}',

	getOldOrderID: 'SELECT "id" FROM stake_orders WHERE "stakeId"=${stakeId}',

	getNewOrderNextVoteMilestone: 'SELECT "nextVoteMilestone" FROM stake_orders WHERE "id"=${id} AND "senderId"=${senderId}',

	updateOldOrder: 'UPDATE stake_orders SET "status"=1, "nextVoteMilestone"=${nextVoteMilestone}, "isVoteDone"=false WHERE "stakeId"=${stakeId} ',

	updateOrderFrozeAmount: 'UPDATE stake_orders SET "freezedAmount"=${freezedAmount} WHERE "stakeId"=${stakeId}',

	deductTotalSupply: 'UPDATE mem_accounts SET "balance"=("balance" - ${reward}), "u_balance"=("u_balance" - ${reward}) WHERE "address"=${totalSupplyAccount}',

	addTotalSupply: 'UPDATE mem_accounts SET "balance"=("balance" + ${reward}), "u_balance"=("u_balance" + ${reward}) WHERE "address"=${totalSupplyAccount}',

};

module.exports = FrogingsSql;
