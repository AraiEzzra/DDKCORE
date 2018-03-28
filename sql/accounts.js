'use strict';

var Accounts = {

  checkAccountStatus : 'SELECT "status" FROM mem_accounts where "address"=${senderId}',

  disableAccount : 'UPDATE mem_accounts SET "status" = 0 WHERE "address" = ${senderId}',

  enableAccount : 'UPDATE mem_accounts SET "status" = 1 WHERE "address" = ${senderId}',

  getTotalAccount : 'SELECT count("address") FROM mem_accounts WHERE "balance" > 0',

  getCurrentUnmined : 'SELECT "balance" FROM mem_accounts where "address"=${address}',

  checkAlreadyMigrated : 'SELECT "isMigrated" FROM mem_accounts where "name"=${username}',
  
  updateUserInfo : 'UPDATE mem_accounts SET "balance" = ${balance},"u_balance"=${balance},"email" = ${email}, "phoneNumber" = ${phone}, "country" = ${country}, "name" = ${username}, "totalFrozeAmount"=${totalFrozeAmount}, "isMigrated" = 1 WHERE "address" = ${address}',

  validateExistingUser: 'SELECT * FROM etps_user  WHERE  "username"=${username} AND "password"=${password}',

  InsertStakeOrder: 'INSERT INTO stake_orders ("id", "status", "startTime", "insertTime", "rewardTime", "nextMilestone", "endTime", "senderId", "freezedAmount", "milestoneCount") VALUES (${account_id},${status},${startTime},${insertTime},${rewardTime},${nextMilestone},${endTime},${senderId},${freezedAmount},${milestoneCount}) ',

  getETPSStakeOrders: 'SELECT * FROM existing_etps_assets WHERE "account_id"=${account_id} AND "status"=0 AND "month_count" < 6',

  totalFrozeAmount: 'SELECT sum("freezedAmount") FROM stake_orders WHERE "id"=${account_id} and "status"=1'
};

module.exports = Accounts;
