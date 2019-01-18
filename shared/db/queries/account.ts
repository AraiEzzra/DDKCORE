export const GET_ALL_ACCOUNTS_BY_ADDRESS =
    ' SELECT "username",' +
    ' "isDelegate",' +
    ' "u_isDelegate",' +
    ' "secondSignature",' +
    ' "u_secondSignature",' +
    ' "u_username",' +
    ' UPPER("address") as "address",' +
    ' ENCODE("publicKey", \'hex\') as "publicKey",' +
    ' ENCODE("secondPublicKey", \'hex\') as "secondPublicKey",' +
    ' ("balance")::bigint as "balance",' +
    ' ("u_balance")::bigint as "u_balance",' +
    ' ("vote")::bigint as "vote",' +
    ' ("rate")::bigint as "rate",' +
    ' (SELECT ARRAY_AGG("dependentId") FROM mem_accounts2delegates WHERE "accountId" = a."address") as "delegates",' +
    ' (SELECT ARRAY_AGG("dependentId") FROM mem_accounts2u_delegates WHERE "accountId" = a."address") as "u_delegates",' +
    ' "url",' +
    ' (SELECT ARRAY_AGG("dependentId") FROM mem_accounts2multisignatures WHERE "accountId" = a."address") as "multisignatures",' +
    ' (SELECT ARRAY_AGG("dependentId") FROM mem_accounts2u_multisignatures WHERE "accountId" = a."address") as "u_multisignatures",' +
    ' "multimin",' +
    ' "u_multimin",' +
    ' "multilifetime",' +
    ' "u_multilifetime",' +
    ' "blockId",' +
    ' "nameexist",' +
    ' "u_nameexist",' +
    ' "producedblocks",' +
    ' "missedblocks",' +
    ' ("fees")::bigint as "fees",' +
    ' ("rewards")::bigint as "rewards",' +
    ' "virgin",' +
    ' "acc_type",' +
    ' ("totalFrozeAmount")::bigint as "transferedAmount",' +
    ' ("u_totalFrozeAmount")::bigint as "u_totalFrozeAmount",' +
    ' "endTime",' +
    ' ("totalFrozeAmount")::bigint as "totalFrozeAmount",' +
    ' ("group_bonus")::bigint as "group_bonus",' +
    ' ("pending_group_bonus")::bigint as "pending_group_bonus",' +
    ' UPPER("introducer") as "introducer"' +
    ' FROM "mem_accounts" as "a"' +
    ' WHERE UPPER("address") = UPPER(${address});';
