const { getOrCreateAccount } = require('src/helpers/account.utils');
const { transactionSortFunc } = require('src/helpers/transaction.utils');

const crypto = require('crypto');
const async = require('async');
const BlockReward = require('../../logic/blockReward.js');
const slots = require('../../helpers/slots.js');
const blockVersion = require('../../logic/block_version.js');
const _ = require('lodash');

const constants = require('../../helpers/constants.js');
const sql = require('../../sql/blocks.js');
const exceptions = require('../../helpers/exceptions.js');

let modules;
let library;
let self;
const __private = {};
__private.lastNBlockIds = [];

__private.blockReward = new BlockReward();

function Verify(logger, block, transaction, db, config) {
    library = {
        logger,
        db,
        logic: {
            block,
            transaction,
        },
        config: {
            loading: {
                snapshotRound: config.loading.snapshotRound,
            },
        },
    };
    self = this;

    library.logger.trace('Blocks->Verify: Submodule initialized.');
    return self;
}

__private.newCheckTransaction = async (block, trs, sender, checkExists) => {
    trs.id = library.logic.transaction.getId(trs);
    trs.blockId = block.id;

    try {
        await library.logic.transaction.newVerify({
            trs,
            sender,
            checkExists
        });
    } catch (e) {
        return { success: false, errors: [e.message || e] };
    }

    try {
        await library.logic.transaction.newVerifyUnconfirmed({
            trs,
            sender
        });
    } catch (e) {
        return { success: false, errors: [e.message || e] };
    }

    return { success: true };
};

/**
 * Set height according to the given last block
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  lastBlock Last block
 * @return {Object}  block Target block
 */
__private.setHeight = function (block, lastBlock) {
    block.height = lastBlock.height + 1;

    return block;
};

/**
 * Verify block signature
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifySignature = function (block, result) {
    let valid;

    try {
        valid = library.logic.block.verifySignature(block);
    } catch (e) {
        if (constants.VERIFY_BLOCK_SIGNATURE) {
            result.errors.push(e.toString());
        } else {
            library.logger.error(e.toString());
        }
    }

    if (!valid) {
        if (constants.VERIFY_BLOCK_SIGNATURE) {
            result.errors.push('Failed to verify block signature');
        } else {
            library.logger.error('Failed to verify block signature');
        }
    }

    return result;
};

/**
 * Verify previous block
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyPreviousBlock = function (block, result) {
    if (!block.previousBlock && block.height !== 1) {
        if (constants.VERIFY_PREVIOUS_BLOCK) {
            result.errors.push('Invalid previous block');
        } else {
            library.logger.error('Invalid previous block');
        }
    }

    return result;
};

/**
 * Verify block is not one of the last {BLOCK_SLOT_WINDOW} saved blocks.
 *
 * @private
 * @func verifyAgainstLastNBlockIds
 * @param {Object} block - Target block
 * @param {Object} result - Verification results
 * @returns {Object} result - Verification results
 * @returns {boolean} result.verified - Indicator that verification passed
 * @returns {Array} result.errors - Array of validation errors
 */
__private.verifyAgainstLastNBlockIds = function (block, result) {
    if (__private.lastNBlockIds.indexOf(block.id) !== -1) {
        if (constants.VERIFY_AGAINST_LAST_N_BLOCK_IDS) {
            result.errors.push('Block already exists in chain');
        } else {
            library.logger.error('Block already exists in chain');
        }
    }

    return result;
};

/**
 * Verify block version
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyVersion = function (block, result) {
    if (!blockVersion.isValid(block.version, block.height)) {
        if (constants.VERIFY_BLOCK_VERSION) {
            result.errors.push('Invalid block version');
        } else {
            library.logger.error('Invalid block version');
        }
    }
    return result;
};

/**
 * Verify block reward
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyReward = function (block, result) {
    let expectedReward = __private.blockReward.calcReward(block.height);

    if (block.height > 21000000) {
        expectedReward = 0;
        block.reward = 0;
    }

    if (block.height !== 1 && expectedReward !== block.reward && exceptions.blockRewards.indexOf(block.id) === -1) {
        if (constants.VERIFY_BLOCK_REWARD) {
            result.errors.push(['Invalid block reward:', block.reward, 'expected:', expectedReward].join(' '));
        } else {
            library.logger.error(['Invalid block reward:', block.reward, 'expected:', expectedReward].join(' '));
        }
    }

    return result;
};

/**
 * Verify block id
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyId = function (block, result) {
    try {
        // Get block ID
        // FIXME: Why we don't have it?
        block.id = library.logic.block.getId(block);
    } catch (e) {
        if (constants.VERIFY_BLOCK_ID) {
            result.errors.push(e.toString());
        } else {
            library.logger.error(e.toString());
        }
    }

    return result;
};

/**
 * Verify block payload (transactions)
 *
 * @private
 * @method verifyBlock
 * @method verifyReceipt
 * @param  {Object}  block Target block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyPayload = function (block, result) {
    if (block.payloadLength > constants.maxPayloadLength) {
        if (constants.PAYLOAD_VALIDATE.MAX_LENGTH) {
            result.errors.push('Payload length is too long');
        } else {
            library.logger.error('Payload length is too long');
        }
    }

    if (block.transactions.length !== block.numberOfTransactions) {
        if (constants.PAYLOAD_VALIDATE.MAX_TRANSACTION_LENGTH) {
            result.errors.push('Included transactions do not match block transactions count');
        } else {
            library.logger.error('Included transactions do not match block transactions count');
        }
    }

    if (block.transactions.length > constants.maxTxsPerBlock) {
        if (constants.PAYLOAD_VALIDATE.MAX_TRANSACTION_IN_BLOCK) {
            result.errors.push('Number of transactions exceeds maximum per block');
        } else {
            library.logger.error('Number of transactions exceeds maximum per block');
        }
    }

    let totalAmount = 0;
    let totalFee = 0;
    const payloadHash = crypto.createHash('sha256');
    const appliedTransactions = {};

    for (const trs of block.transactions) {
        let bytes;

        try {
            library.logger.debug(`Transaction ${JSON.stringify(trs)}`);
            bytes = library.logic.transaction.getBytes(trs, false, false);
            library.logger.trace(`Bytes ${JSON.stringify(bytes)}`);
        } catch (e) {
            result.errors.push(e.toString());
        }

        if (appliedTransactions[trs.id]) {
            if (constants.PAYLOAD_VALIDATE.MAX_TRANSACTION_DUPLICATE) {
                result.errors.push(`Encountered duplicate transaction: ${trs.id}`);
            } else {
                library.logger.error(`Encountered duplicate transaction: ${trs.id}`);
            }
        }

        appliedTransactions[trs.id] = trs;
        if (bytes) {
            payloadHash.update(bytes);
        }
        totalAmount += trs.amount;
        totalFee += trs.fee;
    }
    const hex = payloadHash.digest().toString('hex');

    if (hex !== block.payloadHash) {
        if (constants.PAYLOAD_VALIDATE.INVALID_HASH) {
            result.errors.push('Invalid payload hash');
        } else {
            library.logger.error('Invalid payload hash');
        }
    }

    if (totalAmount !== block.totalAmount) {
        if (constants.PAYLOAD_VALIDATE.TOTAL_AMOUNT) {
            result.errors.push('Invalid total amount');
        } else {
            library.logger.error('Invalid total amount');
        }
    }

    if (totalFee !== block.totalFee) {
        if (constants.PAYLOAD_VALIDATE.TOTAL_FEE) {
            result.errors.push(`Invalid total fee. Expected: ${totalFee}, actual: ${block.totalFee}`);
        } else {
            library.logger.error('Invalid total fee');
        }
    }

    return result;
};

/**
 * Verify block for fork cause one
 *
 * @private
 * @method verifyBlock
 * @param  {Object}  block Target block
 * @param  {Object}  lastBlock Last block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyForkOne = function (block, lastBlock, result) {
    if (block.previousBlock && block.previousBlock !== lastBlock.id) {
        modules.delegates.fork(block, 1);
        if (constants.VERIFY_BLOCK_FORK_ONE) {
            result.errors.push(['Invalid previous block:', block.previousBlock, 'expected:', lastBlock.id].join(' '));
        } else {
            library.logger.error(['Invalid previous block:', block.previousBlock, 'expected:', lastBlock.id].join(' '));
        }
    }

    return result;
};

/**
 * Verify block slot according to timestamp
 *
 * @private
 * @method verifyBlock
 * @param  {Object}  block Target block
 * @param  {Object}  lastBlock Last block
 * @param  {Object}  result Verification results
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
__private.verifyBlockSlot = function (block, lastBlock, result) {
    const blockSlotNumber = slots.getSlotNumber(block.timestamp);
    const lastBlockSlotNumber = slots.getSlotNumber(lastBlock.timestamp);

    if (blockSlotNumber > slots.getSlotNumber() || blockSlotNumber <= lastBlockSlotNumber) {
        if (constants.VERIFY_BLOCK_SLOT) {
            result.errors.push('Invalid block timestamp');
        } else {
            library.logger.error('Invalid block timestamp', JSON.stringify(block));
        }
    }

    return result;
};

/**
 * Verify block slot window according to application time.
 *
 * @private
 * @func verifyBlockSlotWindow
 * @param {Object} block - Target block
 * @returns {Object} result - Verification results
 * @returns {boolean} result.verified - Indicator that verification passed
 * @returns {Array} result.errors - Array of validation errors
 */
__private.verifyBlockSlotWindow = function (block, result) {
    const currentApplicationSlot = slots.getSlotNumber();
    const blockSlot = slots.getSlotNumber(block.timestamp);

    // Reject block if it's slot is older than BLOCK_SLOT_WINDOW
    if (currentApplicationSlot - blockSlot > constants.blockSlotWindow) {
        if (constants.VERIFY_BLOCK_SLOT_WINDOW) {
            result.errors.push('Block slot is too old');
        } else {
            library.logger.error('Block slot is too old');
        }
    }

    // Reject block if it's slot is in the future
    if (currentApplicationSlot < blockSlot) {
        if (constants.VERIFY_BLOCK_SLOT_WINDOW) {
            result.errors.push('Block slot is in the future');
        } else {
            library.logger.error('Block slot is in the future');
        }
    }

    return result;
};

/**
 * Verify block before fork detection and return all possible errors related to block
 *
 * @public
 * @method verifyReceipt
 * @param  {Object}  block Full block
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
Verify.prototype.verifyReceipt = function (block) {
    const lastBlock = modules.blocks.lastBlock.get();

    block = __private.setHeight(block, lastBlock);

    let result = { verified: false, errors: [] };

    result = __private.verifySignature(block, result);
    result = __private.verifyPreviousBlock(block, result);
    result = __private.verifyAgainstLastNBlockIds(block, result);
    result = __private.verifyBlockSlotWindow(block, result);
    result = __private.verifyVersion(block, result);
    // TODO: verify total fee
    result = __private.verifyId(block, result);
    result = __private.verifyPayload(block, result);

    result.verified = result.errors.length === 0;
    result.errors.reverse();

    return result;
};

/**
 * Loads last {BLOCK_SLOT_WINDOW} blocks from the database into memory.
 * Called when application triggeres blockchainReady event.
 */
Verify.prototype.onBlockchainReady = function () {
    return library.db.query(
        'SELECT id FROM blocks ORDER BY id DESC LIMIT ${blockLimit}', { blockLimit: constants.blockSlotWindow }
    ).then((blockIds) => {
        __private.lastNBlockIds = _.map(blockIds, 'id');
    })
        .catch((err) => {
            library.logger.error(
                `Unable to load last ${constants.blockSlotWindow} block ids`
            );
            library.logger.error(err);
        });
};

/**
 * Maintains __private.lastNBlock constiable - a queue of fixed length (BLOCK_SLOT_WINDOW). Called when application triggers newBlock event.
 *
 * @func onNewBlock
 * @param {block} block
 * @todo Add description for the params
 */
Verify.prototype.onNewBlock = function (block) {
    __private.lastNBlockIds.push(block.id);
    if (__private.lastNBlockIds.length > constants.blockSlotWindow) {
        __private.lastNBlockIds.shift();
    }
};

/**
 * Verify block before processing and return all possible errors related to block
 *
 * @public
 * @method verifyBlock
 * @param  {Object}  block Full block
 * @return {Object}  result Verification results
 * @return {boolean} result.verified Indicator that verification passed
 * @return {Array}   result.errors Array of validation errors
 */
Verify.prototype.verifyBlock = function (block, verify) {
    const lastBlock = modules.blocks.lastBlock.get();

    block = __private.setHeight(block, lastBlock);

    let result = { verified: false, errors: [] };

    if (verify) {
        result = __private.verifySignature(block, result);
    }
    result = __private.verifyPreviousBlock(block, result);
    result = __private.verifyVersion(block, result);
    // TODO: verify total fee
    result = __private.verifyId(block, result);
    if (verify) {
        result = __private.verifyPayload(block, result);
    }

    result = __private.verifyForkOne(block, lastBlock, result);
    result = __private.verifyBlockSlot(block, lastBlock, result);

    result.verified = result.errors.length === 0;
    result.errors.reverse();

    if (result.verified) {
        library.logger.info(
            `Verify->verifyBlock succeeded for block ${block.id} at height ${
                block.height
                }.`
        );
    } else {
        library.logger.error(
            `Verify->verifyBlock failed for block ${block.id} at height ${
                block.height
                }.`,
            result.errors
        );
    }
    return result;
};

/**
 * Adds default properties to block.
 *
 * @param {Object} block - Block object reduced
 * @returns {Object} Block object completed
 */
Verify.prototype.addBlockProperties = function (block) {
    block.totalAmount = block.totalAmount || 0;
    block.totalFee = block.totalFee || 0;
    block.reward = block.reward || 0;

    if (block.version === undefined) {
        block.version = constants.CURRENT_BLOCK_VERSION;
    }
    if (block.numberOfTransactions === undefined) {
        if (block.transactions === undefined) {
            block.numberOfTransactions = 0;
        } else {
            block.numberOfTransactions = block.transactions.length;
        }
    }
    if (block.payloadLength === undefined) {
        block.payloadLength = 0;
    }
    if (block.transactions === undefined) {
        block.transactions = [];
    }
    return block;
};

/**
 * Deletes default properties from block.
 *
 * @param {Object} block - Block object completed
 * @returns {Object} Block object reduced
 */
Verify.prototype.deleteBlockProperties = function (block) {
    const reducedBlock = Object.assign({}, block);
    if (reducedBlock.version === constants.CURRENT_BLOCK_VERSION) {
        delete reducedBlock.version;
    }
    // verifyBlock ensures numberOfTransactions is transactions.length
    if (typeof reducedBlock.numberOfTransactions === 'number') {
        delete reducedBlock.numberOfTransactions;
    }
    if (reducedBlock.totalAmount === 0) {
        delete reducedBlock.totalAmount;
    }
    if (reducedBlock.totalFee === 0) {
        delete reducedBlock.totalFee;
    }
    if (reducedBlock.payloadLength === 0) {
        delete reducedBlock.payloadLength;
    }
    if (reducedBlock.reward === 0) {
        delete reducedBlock.reward;
    }
    if (reducedBlock.transactions && reducedBlock.transactions.length === 0) {
        delete reducedBlock.transactions;
    }
    return reducedBlock;
};

/**
 * Adds block properties.
 *
 * @private
 * @func addBlockProperties
 * @param {Object} block - Full block
 * @param {boolean} broadcast - Indicator that block needs to be broadcasted
 * @param {function} cb - Callback function
 * @returns {function} cb - Callback function from params (through setImmediate)
 * @returns {Object} cb.err - Error if occurred
 */
__private.addBlockProperties = function (block, broadcast, cb) {
    if (!broadcast) {
        try {
            // Set default properties
            block = self.addBlockProperties(block);
        } catch (err) {
            return setImmediate(cb, err);
        }
    }

    return setImmediate(cb);
};

__private.newAddBlockProperties = (block, broadcast) => {
    if (!broadcast) {
        self.addBlockProperties(block);
    }
};

__private.newNormalizeBlock = (block) => {
    try {
        block.transactions.sort(transactionSortFunc);
        library.logic.block.objectNormalize(block);
        return { success: true, errors: [] };
    } catch (err) {
        return { success: false, errors: [err] };
    }
};

__private.newVerifyBlock = (block, verify) => {
    const result = self.verifyBlock(block, verify);

    if (!result.verified) {
        library.logger.error(['Block', block.id, 'verification failed', JSON.stringify(result.errors)].join(' '));
    }

    return result;

};

/**
 * Checks if block is in database.
 *
 * @private
 * @func checkExists
 * @param {Object} block - Full block
 * @param {function} cb - Callback function
 * @returns {function} cb - Callback function from params (through setImmediate)
 * @returns {Object} cb.err - Error if occurred
 */
__private.checkExists = function (block, cb) {
    // Check if block id is already in the database (very low probability of hash collision)
    // TODO: In case of hash-collision, to me it would be a special autofork...
    // DATABASE: read only
    library.db.query(sql.getBlockId, { id: block.id })
        .then((rows) => {
            if (rows.length > 0) {
                return setImmediate(cb, ['Block', block.id, 'already exists'].join(' '));
            }
            return setImmediate(cb);
        })
        .catch((err) => {
            library.logger.error(err);
            return setImmediate(cb, 'Block#blockExists error');
        });
};

__private.newCheckExists = async (block) => {
    const rows = await library.db.query(sql.getBlockId, { id: block.id });
    if (rows.length > 0) {
        return { success: false, errors: [['Block', block.id, 'already exists'].join(' ')] };
    }
    return { success: true };
};
/**
 * Checks if block was generated by the right active delagate.
 *
 * @private
 * @func validateBlockSlot
 * @param {Object} block - Full block
 * @param {function} cb - Callback function
 * @returns {function} cb - Callback function from params (through setImmediate)
 * @returns {Object} cb.err - Error if occurred
 */
__private.validateBlockSlot = function (block, cb) {
    // Check if block was generated by the right active delagate. Otherwise, fork 3
    // DATABASE: Read only to mem_accounts to extract active delegate list
    modules.delegates.validateBlockSlot(block, (err) => {
        if (err) {
            // Fork: Delegate does not match calculated slot
            if (constants.VALIDATE_BLOCK_SLOT) {
                modules.delegates.fork(block, 3);
                return setImmediate(cb, err);
            }
            library.logger.error('validateBlockSlot', err);
        }
        return setImmediate(cb);
    });
};

/**
 * Tested with 3 state trs = [true, false, false]; trs = [false, true, true]; trs = [true, true, false];
 * with code sample
 *
 * let errors = [];
 * let i = 0;
 * while ((i < trs.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
    if (errors.length === 0) {
        if (!trs[i]) {
            errors.push(i);
            i--;
            continue
        }
        console.log('apply', i, trs[i]);
        i++;
    } else {
        console.log('undo', i, trs[i]);
        i--;
    }
}
*/
__private.checkTransactionsAndApplyUnconfirmed = async (block, checkExists, verify) => {
    const errors = [];
    let i = 0;

    while ((i < block.transactions.length && errors.length === 0) || (i >= 0 && errors.length !== 0)) {
        const trs = block.transactions[i];

        if (errors.length === 0) {
            const sender = await getOrCreateAccount(library.db, trs.senderPublicKey);
            library.logger.debug(`[Verify][checkTransactionsAndApplyUnconfirmed][sender] ${JSON.stringify(sender)}`);
            if (verify) {
                const resultCheckTransaction = await __private.newCheckTransaction(block, trs, sender, checkExists);

                if (!resultCheckTransaction.success) {
                    errors.push(resultCheckTransaction.errors);
                    library.logger.debug(
                        `[Verify][checkTransactionsAndApplyUnconfirmed][error] ${JSON.stringify(errors)}`
                    );
                    i--;
                    continue;
                }
            }

            await library.logic.transaction.newApplyUnconfirmed(trs);
            i++;
        } else {
            await library.logic.transaction.newUndoUnconfirmed(trs);
            i--;
        }
    }

    return { success: errors.length === 0, errors };
};

Verify.prototype.newProcessBlock = async (block, broadcast, saveBlock, keyPair, verify, tick) => {
    if (modules.blocks.isCleaning.get()) {
        throw new Error('Cleaning up');
    } else if (!__private.loaded) {
        throw new Error('Blockchain is loading');
    }

    __private.newAddBlockProperties(block, broadcast);

    const resultNormalizeBlock = __private.newNormalizeBlock(block);

    if (!resultNormalizeBlock.success) {
        throw new Error(`[normalizeBlock] ${JSON.stringify(resultNormalizeBlock.errors)}`);
    }

    if (verify) {
        const resultVerifyBlock = __private.newVerifyBlock(block, !keyPair);
        if (!resultVerifyBlock.verified) {
            throw new Error(`[verifyBlock] ${JSON.stringify(resultVerifyBlock.errors)}`);
        }
    }

    if (saveBlock) {
        const resultCheckExists = await __private.newCheckExists(block);
        if (!resultCheckExists.success) {
            throw new Error(`[checkExists] ${JSON.stringify(resultCheckExists.errors)}`);
        }
    }
    // validateBlockSlot TODO enable after fix round

    const resultCheckTransactions = await __private.checkTransactionsAndApplyUnconfirmed(block, saveBlock, verify);
    if (!resultCheckTransactions.success) {
        throw new Error(`[checkTransactions] ${JSON.stringify(resultCheckTransactions.errors)}`);
    }

    await modules.blocks.chain.newApplyBlock(block, broadcast, keyPair, saveBlock, tick);

    if (!library.config.loading.snapshotRound) {
        await (new Promise((resolve, reject) => modules.system.update((err) => {
            if (err) {
                library.logger.error(`[Verify][processBlock][system/update] ${err}`);
                library.logger.error(`[Verify][processBlock][system/update][stack] ${err.stack}`);
                reject(err);
            }
            resolve();
        })));
    }
    modules.transactions.reshuffleTransactionQueue();
};

/**
 * Handle modules initialization
 * - accounts
 * - blocks
 * - delegates
 * - transactions
 * @param {modules} scope Exposed modules
 */
Verify.prototype.onBind = function (scope) {
    library.logger.trace('Blocks->Verify: Shared modules bind.');
    modules = {
        accounts: scope.accounts,
        blocks: scope.blocks,
        delegates: scope.delegates,
        transactions: scope.transactions,
        system: scope.system
    };


    // Set module as loaded
    __private.loaded = true;
};

module.exports = Verify;

/** ************************************* END OF FILE ************************************ */
