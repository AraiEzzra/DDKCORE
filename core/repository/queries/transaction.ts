

export default {
    getTransactionsForBlocksByIds: 'SELECT * FROM trs WHERE block_id IN ($1:csv)',
    getTotalCountTransactions: 'SELECT count(*)::int AS count FROM trs',
    getTransactionBatch: ' SELECT * FROM trs ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}'
};
