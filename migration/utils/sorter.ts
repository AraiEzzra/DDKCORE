import { runGarbageCollection } from 'migration/migration';

const MAX_TREE_LENGTH = 15;
const NOT_CORRECT_REFERRALS = 3305;

type SerializedRegisterTransactions = Array<{ referrals: Array<string>, senderAddress: BigInt }>;

export const sortRegisterTrs = (transactions: SerializedRegisterTransactions): SerializedRegisterTransactions => {
    console.log('START sort trs!');
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

    let count = 0;
    while (notSortedTransactions.length !== NOT_CORRECT_REFERRALS) {
        const trs = notSortedTransactions.shift();
        if (migratedAddresses.has(trs.referrals[0])) {
            sortedTransactions.push(trs);
            migratedAddresses.add(trs.senderAddress.toString());
        } else {
            notSortedTransactions.push(trs);
        }
        console.log('SORTED: ', ++count);
        console.log('notSortedTransactions: ', notSortedTransactions.length);
    }
    notSortedTransactions.length = 0;
    migratedAddresses.clear();

    runGarbageCollection();

    console.log('cleared notSortedTransactions: ', notSortedTransactions);
    console.log('cleared migratedAddresses: ', migratedAddresses);
    console.log('FINISH sort trs');
    return sortedTransactions;
};
