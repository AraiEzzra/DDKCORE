'use strict';

var Referals = {

    updateReferLink : 'UPDATE mem_accounts SET "referralLink" = ${referralLink} WHERE "address" = ${address}',
    referLevelChain : 'SELECT level from referals WHERE "address" = ${address}',
    checkBalance : 'SELECT u_balance from mem_accounts WHERE "address" = ${sender_address}',
    insertLevelChain : 'INSERT INTO referals ("address","level") VALUES (${address},${level})'
}

module.exports = Referals;
