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
 * @param {Integer} FROZE - froze transation
 * @param {Integer} CONTRACT - contract transation
 * @param {Integer} SENDFREEZE - send freeze transation
 * @returns {Object}
*/
module.exports = {
	SEND: 0,
	SIGNATURE: 1,
	DELEGATE: 2,
	VOTE: 3,
	MULTI: 4,
	DAPP: 5,
	IN_TRANSFER: 6,
	OUT_TRANSFER: 7,
	FROZE: 8,
	CONTRACT: 9,
	SENDFREEZE : 10
};

/*************************************** END OF FILE *************************************/
