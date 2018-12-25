
const transactionType = require('../../helpers/transactionTypes');

const typeMapBack = new Map();

let getCorrectTypeForBack = function(frontType) {

    typeMapBack.set(-1, transactionType.REFERRAL);
    typeMapBack.set(0, transactionType.SEND);
    typeMapBack.set(1, transactionType.SIGNATURE);
    typeMapBack.set(2, transactionType.DELEGATE);
    typeMapBack.set(3, transactionType.VOTE);
    typeMapBack.set(4, transactionType.MULTI);
    typeMapBack.set(5, transactionType.DAPP);
    typeMapBack.set(6, transactionType.IN_TRANSFER);
    typeMapBack.set(7, transactionType.OUT_TRANSFER);
    typeMapBack.set(8, transactionType.STAKE);
    typeMapBack.set(9, transactionType.REWARD);
    typeMapBack.set(10, transactionType.SENDSTAKE);
    typeMapBack.set(11, transactionType.REFER);
    typeMapBack.set(12, transactionType.MIGRATION);

    return typeMapBack.get(frontType);
};

module.exports = getCorrectTypeForBack;

const typeMapFront = new Map();

let getCorrectTypeForFront = function(backType) {

    typeMapFront.set(transactionType.REFERRAL, -1);
    typeMapFront.set(transactionType.SEND, 0);
    typeMapFront.set(transactionType.SIGNATURE, 1);
    typeMapFront.set(transactionType.DELEGATE, 2);
    typeMapFront.set(transactionType.VOTE, 3);
    typeMapFront.set(transactionType.MULTI, 4);
    typeMapFront.set(transactionType.DAPP, 5);
    typeMapFront.set(transactionType.IN_TRANSFER, 6);
    typeMapFront.set(transactionType.OUT_TRANSFER, 7);
    typeMapFront.set(transactionType.STAKE, 8);
    typeMapFront.set(transactionType.REWARD, 9);
    typeMapFront.set(transactionType.SENDSTAKE, 10);
    typeMapFront.set(transactionType.REFER, 11);
    typeMapFront.set(transactionType.MIGRATION, 12);

    return typeMapFront.get(backType);
};

module.exports = getCorrectTypeForFront;
