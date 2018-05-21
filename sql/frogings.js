'use strict';

var FrogingsSql = {
  sortFields: [
    'id',
    'status',
    'startTime',
    'insertTime',
    'rewardTime',
    'nextMilestone',
    'endTime',
    'senderId',
    'recipientId',
    'freezedAmount',
    'milestoneCount'
  ],

  count: 'SELECT COUNT("id")::int AS "count" FROM stake_orders',

  getMemoryAccounts: 'SELECT * FROM  mem_accounts',

  updateFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${freezedAmount}) WHERE "address" = ${senderId}',

  getFrozeAmount: 'SELECT "totalFrozeAmount" FROM mem_accounts WHERE "address"=${senderId}',

  disableFrozeOrders: 'UPDATE stake_orders SET "status"=0 ,"nextMilestone"=-1, "nextVoteMilestone"=-1 where "status"=1 AND ${totalMilestone} = "milestoneCount"',

  checkAndUpdateMilestone: 'UPDATE stake_orders SET "nextVoteMilestone"= ("nextVoteMilestone" +${milestone}),"rewardTime"=${currentTime}, "isVoteDone"= false where "status"=1 AND ("startTime"+ ${currentTime} - "insertTime") >= "nextVoteMilestone" ',

  getfrozeOrder: 'SELECT "senderId" , "freezedAmount", "endTime", "milestoneCount", "nextVoteMilestone", "voteCount" FROM stake_orders WHERE "status"=1 AND ("startTime"+ ${currentTime} - "insertTime") >= "nextVoteMilestone" ',

  deductFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" - ${FrozeAmount}) WHERE "address" = ${senderId}',

  getFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId}',

  getActiveFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "status"=1',

  getActiveFrozeOrder: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "id"=${frozeId} AND "status"=1',

  updateFrozeOrder: 'UPDATE stake_orders SET "status"=0,"recipientId"=${recipientId}, "nextVoteMilestone"=-1 WHERE "senderId"=${senderId} AND "id"=${frozeId} AND "status"=1',

  createNewFrozeOrder: 'INSERT INTO stake_orders ("id","status","startTime","insertTime","rewardTime","nextMilestone","endTime","senderId","freezedAmount","milestoneCount","voteCount","nextVoteMilestone","isVoteDone") VALUES (${frozeId},1,${startTime},${insertTime},${rewardTime},${nextMilestone},${endTime},${senderId},${freezedAmount},${milestoneCount},${voteCount},${nextVoteMilestone},${isVoteDone}) ',

  countStakeholders: 'SELECT count(DISTINCT "senderId") FROM stake_orders WHERE "status"=1',

  getTotalStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "status"=1',

  getMyStakedAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "senderId"=${address} AND "status"=1',

  updateOrder: 'UPDATE stake_orders SET "milestoneCount" = ("milestoneCount" + 1), "voteCount"=0, "isVoteDone"=false WHERE "senderId" = ${senderId}',

  checkRewardCount: 'SELECT "milestoneCount" FROM stake_orders WHERE "status"=1 AND "senderId"=${senderId}'

};

module.exports = FrogingsSql;
