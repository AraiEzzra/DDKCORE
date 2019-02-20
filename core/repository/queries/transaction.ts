

export default {
    getTransactionsForBlocksByIds: 'SELECT * FROM trs WHERE block_id IN ($1:csv)'
};
