'use strict';

//Hotam Singh
var TransactionsSql = {
  sortFields: [
    'id',
    'status',
    'startTime',
    'nextMilestone',
    'endTime',
    'senderId',
    'recipientId',
    'freezedAmount',
    'milestoneCount'
  ],

  count: 'SELECT COUNT("id")::int AS "count" FROM stake_orders',

  checkAccountStatus: 'SELECT "status" FROM mem_accounts where "address"=${senderId}',

  disableAccount: 'UPDATE mem_accounts SET "status" = 0 WHERE "address" = ${senderId}',

  enableAccount: 'UPDATE mem_accounts SET "status" = 1 WHERE "address" = ${senderId}',

  getMemoryAccounts: 'SELECT * FROM  mem_accounts',

  updateFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" + ${totalFrozeAmount}) WHERE "address" = ${senderId}',

  getFrozeAmount: 'SELECT "totalFrozeAmount" FROM mem_accounts WHERE "address"=${senderId}',

  disableFrozeOrders: 'UPDATE stake_orders SET "status"=0 ,"nextMilestone"=-1 where "status"=1 AND ${totalMilestone} = "milestoneCount"',

  checkAndUpdateMilestone: 'UPDATE stake_orders SET "nextMilestone"= ("nextMilestone" +${milestone}), "milestoneCount"=("milestoneCount" + 1) where "status"=1 AND ${currentTime} >= "nextMilestone" ',

  frozeBenefit: 'SELECT "senderId" , "freezedAmount", "endTime","milestoneCount","nextMilestone" FROM stake_orders WHERE "status"=1 AND ${currentTime} >= "nextMilestone" ',

  deductFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ("totalFrozeAmount" - ${FrozeAmount}) WHERE "address" = ${senderId}',

  getFrozeOrders: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId}',

  getActiveFrozeOrder: 'SELECT * FROM stake_orders WHERE "senderId"=${senderId} AND "id"=${frozeId} AND "status"=1',

  updateFrozeOrder: 'UPDATE stake_orders SET "status"=0,"recipientId"=${recipientId} WHERE "senderId"=${senderId} AND "id"=${frozeId} AND "status"=1',

  createNewFrozeOrder: 'INSERT INTO stake_orders ("id","status","startTime","nextMilestone","endTime","senderId","freezedAmount","milestoneCount") VALUES (${frozeId},1,${startTime},${nextMilestone},${endTime},${senderId},${freezedAmount},${milestoneCount}) '

};

module.exports = TransactionsSql;
