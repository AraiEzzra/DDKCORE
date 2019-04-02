export const createBlockQuery = 'INSERT INTO block' +
    ' (id, version, created_at, height, previous_block_id, transaction_count, amount, fee, payload_hash, ' +
    ' generator_public_key, signature) VALUES ' +
    ' (${id}, ${version}, ${created_at}, ${height}, ${previous_block_id}, ${transaction_count}, ${amount},' +
    '  ${fee}, ${payload_hash}, ${generator_public_key}, ${signature}) RETURNING *';

export const createTransactionQuery = 'INSERT INTO trs' +
    ' (id, block_id, type, created_at, sender_public_key, signature, second_signature, fee, salt, asset )' +
    ' VALUES (${id}, ${block_id}, ${type}, ${created_at}, ${sender_public_key}, ${signature},' +
    '  ${second_signature}, ${fee}, ${salt}, ${asset}) RETURNING *';
