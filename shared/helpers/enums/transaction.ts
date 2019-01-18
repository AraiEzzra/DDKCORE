/**
 * @desc Total transations used in DDK and their types
 * @param {Integer} SEND - send transation
 * @param {Integer} SIGNATURE - signature transation
 * @param {Integer} DELEGATE - register a delegate transation
 * @param {Integer} VOTE - vote transation
 * @param {Integer} MULTI - register multi signature transation
 * @param {Integer} DAPP - dapp transation
 * @param {Integer} IN_TRANSFER - in-transafer transation
 * @param {Integer} OUT_TRANSFER - out-transafer transation
 * @param {Integer} STAKE - froze transation
 * @param {Integer} CONTRACT - contract transation
 * @param {Integer} SENDSTAKE - send freeze transation
 * @param {Integer} REFER - Referral reward transaction.
 * @returns {Object}
 */
const enum TransactionType {
    REFERRAL = 0,
    SEND = 10,
    SIGNATURE = 20,
    DELEGATE = 30,
    STAKE = 40,
    SENDSTAKE = 50,
    VOTE = 60,
    MULTI = 70,
    DAPP = 80,
    IN_TRANSFER = 90,
    OUT_TRANSFER = 100,
}

export {
    TransactionType
}