const constants = require('../helpers/constants.js');
const crypto = require('crypto');
const sandboxHelper = require('../helpers/sandbox.js');
const schema = require('../schema/signatures.js');
const Signature = require('../logic/signature.js');
const transactionTypes = require('../helpers/transactionTypes.js');

// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};

__private.assetTypes = {};

/**
 * Initializes library with scope content and generates a Signature instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:signatures
 * @class
 * @classdesc Main signatures methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function Signatures(cb, scope) {
    library = {
        schema: scope.schema,
        ed: scope.ed,
        balancesSequence: scope.balancesSequence,
        logic: {
            transaction: scope.logic.transaction,
        },
    };
    self = this;

    __private.assetTypes[transactionTypes.SIGNATURE] = library.logic.transaction.attachAssetType(
        transactionTypes.SIGNATURE,
        new Signature(
            scope.schema,
            scope.logic.account,
            scope.logger
        )
    );

    setImmediate(cb, null, self);
}

// Public methods
/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
Signatures.prototype.isLoaded = function () {
    return !!modules;
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Signatures.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Calls Signature.bind() with modules params.
 * @implements module:signatures#Signature~bind
 * @param {modules} scope - Loaded modules.
 */
Signatures.prototype.onBind = function (scope) {
    modules = {
        accounts: scope.accounts,
        transactions: scope.transactions,
    };

    __private.assetTypes[transactionTypes.SIGNATURE].bind(
        scope.accounts
    );
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Signatures.prototype.shared = {
    getFee(req, cb) {
        const fee = constants.fees.secondsignature;

        return setImmediate(cb, null, { fee });
    },

    addSignature(req, cb) {
        library.schema.validate(req.body, schema.addSignature, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);
            const publicKey = keypair.publicKey.toString('hex');

            if (req.body.publicKey) {
                if (publicKey !== req.body.publicKey) {
                    return setImmediate(cb, 'Invalid passphrase');
                }
            }

            library.balancesSequence.add((cb) => {
                modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                    if (err) {
                        return setImmediate(cb, err);
                    }

                    if (!account || !account.publicKey) {
                        return setImmediate(cb, 'Account not found');
                    }

                    if (account.secondSignature || account.u_secondSignature) {
                        return setImmediate(cb, 'Account already has a second passphrase');
                    }

                    if (
                        (
                            constants.fees.secondsignature +
                            parseInt(account.u_totalFrozeAmount)
                        ) > parseInt(account.u_balance)
                    ) {
                        return setImmediate(cb, 'Insufficient balance');
                    }

                    const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                    const secondKeypair = library.ed.makeKeypair(secondHash);

                    library.logic.transaction.create({
                        type: transactionTypes.SIGNATURE,
                        sender: account,
                        keypair,
                        secondKeypair
                    }).then((transactionSignature) => {
                        transactionSignature.status = 0;
                        modules.transactions.putInQueue(transactionSignature);
                        return setImmediate(cb, null, [transactionSignature]);
                    }).catch(e => setImmediate(cb, e.toString()));
                });
            }, (err, transaction) => {
                if (err) {
                    return setImmediate(cb, err);
                }
                return setImmediate(cb, null, { transaction: transaction[0] });
            });
        });
    }
};

// Export
module.exports = Signatures;

/** ************************************* END OF FILE ************************************ */
