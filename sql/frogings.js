

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

	updateAccountBalance: 'UPDATE mem_accounts SET "balance"=("balance" + ${reward}), "u_balance"=("u_balance" + ${reward}) WHERE "address"=${senderId}',

	updateFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${reward}) WHERE "address" = ${senderId}',

	getFrozeAmount: 'SELECT "totalFrozeAmount" FROM mem_accounts WHERE "address"=${senderId}',

	disableFrozeOrders: 'UPDATE stake_orders SET "status"=0 where "stakeId"=${stakeId}',

	enableFrozeOrder: 'UPDATE stake_orders SET "status"=1 where "stakeId"=${stakeId}',

	deductFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" - ${orderFreezedAmount}), "u_totalFrozeAmount" = ("u_totalFrozeAmount" - ${orderFreezedAmount}) WHERE "address" = ${senderId}',

	getFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} ORDER BY "insertTime" DESC LIMIT ${limit} OFFSET ${offset}',

	getFrozeOrdersCount: 'SELECT count(*) FROM stake_orders WHERE "senderId"=${senderId}',

	getActiveFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "status"=1 AND ${currentTime} >= "nextVoteMilestone"',

	getActiveFrozeOrder: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "id"=${stakeId} AND "status"=1',

	updateFrozeOrder: 'UPDATE stake_orders SET "status"=0,"recipientId"=${recipientId}, "nextVoteMilestone"=-1, "transferCount" = ("transferCount"+1) WHERE "senderId"=${senderId} AND "id"=${stakeId} AND "status"=1 RETURNING *',

	createNewFrozeOrder: 'INSERT INTO stake_orders ("id","status","startTime","insertTime","senderId","freezedAmount","rewardCount","voteCount","nextVoteMilestone","isVoteDone","transferCount") VALUES (${id},1,${startTime},${insertTime},${senderId},${freezedAmount},${rewardCount},${voteCount},${nextVoteMilestone},${isVoteDone},$(transferCount)+1) RETURNING *',

	countStakeholders: 'select count(1) from (select 1 from stake_orders o where o.status = 1 group by "senderId") a',

	getTotalStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "status"=1',

	getMyStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "senderId"=${address} AND "status"=1',

	removeOrderByTrsId: 'DELETE FROM stake_orders WHERE "id" = ${transactionId}',

    removeOrderByTrsIdAndSenderId: 'DELETE FROM stake_orders WHERE "id" = ${id} AND "senderId" = ${senderId}',

	getOrderForUndo: 'SELECT id, "nextVoteMilestone" FROM stake_orders WHERE (SELECT id FROM stake_orders WHERE "stakeId"=${stakeId})=id AND "senderId"=${senderId}',

	updateOldOrder: 'UPDATE stake_orders SET "status"=1, "nextVoteMilestone"=${nextVoteMilestone}, "isVoteDone"=false, "recipientId"=NULL WHERE "stakeId"=${stakeId}',

    updateTotalSupply: 'UPDATE mem_accounts SET "balance"=("balance" + ${reward}), "u_balance"=("u_balance" + ${reward}) WHERE "address"=${totalSupplyAccount}',

	getRecentlyChangedFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND ${currentTime} < "nextVoteMilestone"',
	
	getStakeRewardHistory: 'SELECT "v_reward", "t_timestamp", count(*) OVER() AS rewards_count from full_blocks_list WHERE "t_senderId" = ${senderId} AND "v_reward" > 0 ORDER BY "t_timestamp" DESC LIMIT ${limit} OFFSET ${offset}'
};

module.exports = FrogingsSql;
