'use strict';

var Accounts = {

  checkAccountStatus : 'SELECT "status" FROM mem_accounts where "address"=${senderId}',

  disableAccount : 'UPDATE mem_accounts SET "status" = 0 WHERE "address" = ${senderId}',

  enableAccount : 'UPDATE mem_accounts SET "status" = 1 WHERE "address" = ${senderId}'

};

module.exports = Accounts;
