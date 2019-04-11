import { SerializedTransaction } from 'shared/model/transaction';

const MAX_TREE_LENGTH = 15;
type SerializedRegisterTransactions = Array<SerializedTransaction<{ referral: Array<string> }>>;

const sortRegisterTrs = (transactions: SerializedRegisterTransactions): SerializedRegisterTransactions => {
    const migratedAddresses = new Set<string>();

    transactions.sort((a, b) => {
        if (a.asset.referral.length > b.asset.referral.length) {
            return 1;
        }
        if (a.asset.referral.length < b.asset.referral.length) {
            return -1;
        }
        return 0;
    });

    const sortedTransactions = transactions.filter(trs => trs.asset.referral.length < MAX_TREE_LENGTH);
    sortedTransactions.forEach(trs => {
        migratedAddresses.add(trs.senderAddress);
    });

    const notSortedTransactions = transactions.filter(trs => trs.asset.referral.length === MAX_TREE_LENGTH);
    console.log('notSortedTransactions.length', notSortedTransactions.length);

    while (notSortedTransactions.length) {
        const trs = notSortedTransactions.shift();
        if (migratedAddresses.has(trs.asset.referral[0])) {
            sortedTransactions.push(trs);
            migratedAddresses.add(trs.senderAddress);
        } else {
            notSortedTransactions.push(trs);
        }
    }
    return sortedTransactions;
};
