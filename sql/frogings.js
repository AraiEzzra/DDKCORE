'use strict';

//Hotam Singh
var TransactionsSql = {
  sortFields: [
    'id',
    'type',
    'startTime',
    'endTime',
    'senderId',
    'recipientId',
    'freezedAmount',
    'totalAmount'
  ],

  count: 'SELECT COUNT("id")::int AS "count" FROM stake_orders',

  checkAccountStatus: 'SELECT "status" FROM mem_accounts where "address"=${senderId}',

  disableAccount: 'UPDATE mem_accounts SET "status" = 0 WHERE "address" = ${senderId}',

  enableAccount: 'UPDATE mem_accounts SET "status" = 1 WHERE "address" = ${senderId}',

  getMemoryAccounts: 'SELECT * FROM  mem_accounts',

  updateFrozeAmount: 'UPDATE mem_accounts SET "totalFrozeAmount" = ${totalFrozeAmount} WHERE "address" = ${senderId}',

  getFrozeAmount: 'SELECT "totalFrozeAmount" FROM mem_accounts WHERE "address"=${senderId}'

};

module.exports = TransactionsSql;
