'use strict';

var ETP = {

    query : 'SELECT * FROM ${tableName}',

    getBlocksData: 'SELECT * FROM blocks',

    getDappsData: 'SELECT * FROM dapps',

    getDelegatesData: 'SELECT * FROM delegates',

    getMemAccountsData: 'SELECT * FROM mem_accounts',

    getMigrationsData: 'SELECT * FROM migrations',

    getRoundsFeesData: 'SELECT * FROM rounds_fees',

    getTrsData: 'SELECT * from trs',

    getVotesData: 'SELECT * from votes',

    getSignaturesData: 'SELECT * FROM signatures',

    getStakeOrdersData: 'SELECT * FROM stake_orders',

    getPeersData: 'SELECT * FROM peers',

    getPeersDappData: 'SELECT * FROM peers_dapp',

    getInTransferData: 'SELECT * FROM intransfer',

    getOutTransferData: 'SELECT * FROM outtransfer',

    getMultisignaturesData: 'SELECT * FROM multisignatures'

};

module.exports = ETP;