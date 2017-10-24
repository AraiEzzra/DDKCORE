'use strict';

var AccountsSql = {

  checkAccountStatus : 'SELECT "status" FROM mem_accounts where "address"=${senderId}'

};

module.exports = AccountsSql;
