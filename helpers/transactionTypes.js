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
module.exports = {
	REFERRAL: 0,
    SEND: 1,
    SIGNATURE: 2,
    DELEGATE: 3,
    STAKE: 4,
    MIGRATION: 4,
    SENDSTAKE: 5,
    VOTE: 6,
    MULTI: 7,
    DAPP: 8,
    IN_TRANSFER: 9,
    OUT_TRANSFER: 10,
};

/*************************************** END OF FILE *************************************/
