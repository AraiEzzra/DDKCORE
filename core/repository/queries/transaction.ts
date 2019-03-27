
export default {
    getByBlockIds: 'SELECT * FROM trs WHERE block_id IN ($1:csv)',
    getById: 'SELECT * FROM trs WHERE id = ${id}',
    getTransactionBatch: 'SELECT * FROM trs ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}',
    deleteByIds: 'DELETE FROM trs WHERE id IN ($1:csv) RETURNING id'
};
