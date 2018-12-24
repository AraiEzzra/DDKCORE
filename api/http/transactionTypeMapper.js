
const transactionType = require('../../helpers/transactionTypes');

function getCorrectTypeForBack(frontType) {

    const typeMap = new Map();

    typeMap.set(-1, transactionType.REFERRAL);
    typeMap.set(0, transactionType.SEND);
    typeMap.set(1, transactionType.SIGNATURE);
    typeMap.set(2, transactionType.DELEGATE);
    typeMap.set(3, transactionType.VOTE);
    typeMap.set(4, transactionType.MULTI);
    typeMap.set(5, transactionType.DAPP);
    typeMap.set(6, transactionType.IN_TRANSFER);
    typeMap.set(7, transactionType.OUT_TRANSFER);
    typeMap.set(8, transactionType.STAKE);
    typeMap.set(9, transactionType.REWARD);
    typeMap.set(10, transactionType.SENDSTAKE);
    typeMap.set(11, transactionType.REFER);
    typeMap.set(12, transactionType.MIGRATION);

    return typeMap.get(frontType);
}

module.exports = getCorrectTypeForBack(frontType);

function getCorrectTypeForFront(backType) {

    const typeMap = new Map();

    typeMap.set(transactionType.REFERRAL, -1);
    typeMap.set(transactionType.SEND, 0);
    typeMap.set(transactionType.SIGNATURE, 1);
    typeMap.set(transactionType.DELEGATE, 2);
    typeMap.set(transactionType.VOTE, 3);
    typeMap.set(transactionType.MULTI, 4);
    typeMap.set(transactionType.DAPP, 5);
    typeMap.set(transactionType.IN_TRANSFER, 6);
    typeMap.set(transactionType.OUT_TRANSFER, 7);
    typeMap.set(transactionType.STAKE, 8);
    typeMap.set(transactionType.REWARD, 9);
    typeMap.set(transactionType.SENDSTAKE, 10);
    typeMap.set(transactionType.REFER, 11);
    typeMap.set(transactionType.MIGRATION, 12);

    return typeMap.get(backType);
}

module.exports = getCorrectTypeForFront(backType);
