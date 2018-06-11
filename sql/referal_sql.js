'use strict';

var Referals = {

    updateReferLink : 'UPDATE mem_accounts SET "referralLink" = ${referralLink} WHERE "address" = ${address}',
    referLevelChain : 'SELECT level from referals WHERE "address" = ${address}',
    checkBalance : 'SELECT balance from mem_accounts WHERE "address" = ${sender_address}'
}

module.exports = Referals;
