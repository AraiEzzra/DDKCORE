const LoaderSql = {
    countBlocks: 'SELECT COUNT(1)::int FROM blocks',

    getGenesisBlock: 'SELECT "id", "payloadHash", "blockSignature" FROM blocks WHERE "height" = 1',

    countMemAccounts: 'SELECT COUNT(*)::int FROM mem_accounts WHERE "blockId" = (SELECT "id" FROM "blocks" ORDER BY "height" DESC LIMIT 1)',

    getMemRounds: 'SELECT "round" FROM mem_round GROUP BY "round"',

    updateMemAccounts: 'UPDATE mem_accounts SET "u_isDelegate" = "isDelegate", "u_secondSignature" = "secondSignature", "u_username" = "username", "u_balance" = "balance", "u_delegates" = "delegates", "u_multisignatures" = "multisignatures", "u_multimin" = "multimin", "u_multilifetime" = "multilifetime", "u_totalFrozeAmount" = "totalFrozeAmount" WHERE "u_isDelegate" <> "isDelegate" OR "u_secondSignature" <> "secondSignature" OR "u_username" <> "username" OR "u_balance" <> "balance" OR "u_delegates" <> "delegates" OR "u_multisignatures" <> "multisignatures" OR "u_multimin" <> "multimin" OR "u_multilifetime" <> "multilifetime" OR "u_totalFrozeAmount" <> "totalFrozeAmount";',

    getDelegates: 'SELECT "publicKey" FROM "delegate_to_vote_counter"',

    countDuplicatedDelegates: 'WITH duplicates AS (SELECT COUNT(1) FROM delegates GROUP BY "transactionId" HAVING COUNT(1) > 1) SELECT count(1) FROM duplicates'
};

module.exports = LoaderSql;
