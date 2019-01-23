export const transactionSortFunc = (a, b) => {
    if (a.type < b.type) {
        return -1;
    }
    if (a.type > b.type) {
        return 1;
    }
    if (a.timestamp < b.timestamp) {
        return -1;
    }
    if (a.timestamp > b.timestamp) {
        return 1;
    }
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }
    return 0;
};

export default exports = {
    transactionSortFunc
};
