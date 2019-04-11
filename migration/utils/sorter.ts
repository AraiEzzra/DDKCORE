const MAX_TREE_LENGTH = 15;
type SerializedRegisterTransactions = Array<{ referrals: Array<string>, senderAddress: BigInt }>;

export const sortRegisterTrs = (transactions: SerializedRegisterTransactions): SerializedRegisterTransactions => {
    const migratedAddresses = new Set<string>();

    transactions.sort((a, b) => {
        if (a.referrals.length > b.referrals.length) {
            return 1;
        }
        if (a.referrals.length < b.referrals.length) {
            return -1;
        }
        return 0;
    });

    const sortedTransactions = transactions.filter(trs => trs.referrals.length < MAX_TREE_LENGTH);
    sortedTransactions.forEach(trs => {
        migratedAddresses.add(trs.senderAddress.toString());
    });

    const notSortedTransactions = transactions.filter(trs => trs.referrals.length === MAX_TREE_LENGTH);
    console.log('notSortedTransactions.length', notSortedTransactions.length);

    while (notSortedTransactions.length) {
        const trs = notSortedTransactions.shift();
        if (migratedAddresses.has(trs.referrals[0])) {
            sortedTransactions.push(trs);
            migratedAddresses.add(trs.senderAddress.toString());
        } else {
            notSortedTransactions.push(trs);
        }
    }
    return sortedTransactions;
};
