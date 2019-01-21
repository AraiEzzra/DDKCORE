const constants = require('../helpers/constants.js');
const sql = require('../sql/delegates');

// Private fields
let modules;
let library;
let self;

/**
 * Initializes library.
 * @memberof module:delegates
 * @class
 * @classdesc Main delegate logic.
 * @param {ZSchema} schema
 */
function Delegate(schema, db) {
    library = {
        schema,
        db
    };
    self = this;
}

// Public methods
/**
 * Binds input parameters to private variables modules.
 * @param {Accounts} accounts
 */
Delegate.prototype.bind = function (accounts) {
    modules = {
        accounts,
    };
};

/**
 * Creates a delegate.
 * @param {Object} data - Entry information: username, publicKey.
 * @param {transaction} trs - Transaction to assign the delegate.
 * @returns {Object} trs with new data
 */
Delegate.prototype.create = function (data, trs) {
    // TODO Can be in future will be added delegate URL
    trs.recipientId = null;
    trs.amount = 0;
    trs.asset.delegate = {
        username: data.username,
        publicKey: data.sender.publicKey
    };

    if (trs.asset.delegate.username) {
        trs.asset.delegate.username = trs.asset.delegate.username.toLowerCase().trim();
    }
    trs.trsName = 'DELEGATE';
    return trs;
};

/**
 * Obtains constant fee delegate.
 * @see {@link module:helpers/constants}
 * @returns {number} constants.fees.delegate
 * @todo delete unnecessary function parameters trs, sender.
 */
Delegate.prototype.calculateFee = function () {
    return constants.fees.delegate;
};

/**
 * Verifies fields from transaction and sender, calls modules.accounts.getAccount().
 * @implements module:accounts#Account~getAccount
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback|Object} returns error if invalid parameter |
 * trs validated.
 */
Delegate.prototype.verify = function (trs, sender, cb) {
    if (trs.recipientId) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Invalid recipient');
        }
        library.logger.error('Invalid recipient');

    }

    if (trs.amount !== 0) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Invalid transaction amount');
        }
        library.logger.error('Invalid transaction amount');
    }

    if (sender.isDelegate) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Account is already a delegate');
        }
        library.logger.error('Account is already a delegate');
    }

    if (sender.u_isDelegate) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Account is under process for delegate registration');
        }
        library.logger.error('Account is under process for delegate registration');
    }

    if (!trs.asset || !trs.asset.delegate) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Invalid transaction asset');
        }
        library.logger.error('Invalid transaction asset');
    }

    if (!trs.asset.delegate.username) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Username is undefined');
        }
        library.logger.error('Username is undefined');
    }

    if (trs.asset.delegate.username !== trs.asset.delegate.username.toLowerCase()) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Username must be lowercase');
        }
        library.logger.error('Username must be lowercase');
    }

    const isAddress = /^(DDK)+[0-9]{1,25}$/ig;
    const allowSymbols = /^[a-z0-9!@$&_.]+$/g;

    const username = String(trs.asset.delegate.username)
        .toLowerCase()
        .trim();

    if (username === '') {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Empty username');
        }
        library.logger.error('Empty username');
    }

    if (username.length > 20) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Username is too long. Maximum is 20 characters');
        }
        library.logger.error('Username is too long. Maximum is 20 characters');

    }

    if (isAddress.test(username)) {
        return setImmediate(cb, 'Username can not be a potential address');
    }

    if (!allowSymbols.test(username)) {
        if (constants.VERIFY_DELEGATE_TRS_RECIPIENT) {
            return setImmediate(cb, 'Username can only contain alphanumeric characters with the exception of !@$&_.');
        }
        library.logger.error('Username can only contain alphanumeric characters with the exception of !@$&_.');
    }

    modules.accounts.getAccount({
        username
    }, function (err, account) {
        if (err) {
            return setImmediate(cb, err);
        }

        if (account) {
            return setImmediate(cb, 'Username already exists');
        }

        return setImmediate(cb, null, trs);
    });
};

// TODO implement it
Delegate.prototype.newVerify = async () => {};

Delegate.prototype.verifyUnconfirmed = function (trs, sender, cb) {
    return setImmediate(cb);
};

Delegate.prototype.newVerifyUnconfirmed = async () => {};

/**
 * Returns transaction with setImmediate.
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} Null error
 * @todo delete extra parameter sender.
 */
Delegate.prototype.process = function (trs, sender, cb) {
    return setImmediate(cb, null, trs);
};

/**
 * Validates delegate username and returns buffer.
 * @param {transaction} trs
 * @returns {null|string} Returns null if no delegate| buffer.
 * @throws {error} If buffer fails.
 */
Delegate.prototype.getBytes = function (trs) {
    return trs.asset.delegate.username ? Buffer.from(trs.asset.delegate.username, 'utf8') : Buffer.from([]);
};

/**
 * Checks trs delegate and calls modules.accounts.setAccountAndGet() with username.
 * @implements module:accounts#Accounts~setAccountAndGet
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 */
Delegate.prototype.apply = function (trs, block, sender, cb) {
    const data = {
        address: sender.address,
        u_isDelegate: 0,
        isDelegate: 1,
        vote: 0
    };

    if (trs.asset.delegate.username) {
        data.u_username = null;
        data.username = trs.asset.delegate.username;
    }

    library.db.none(sql.addDelegateVoteRecord, { publicKey: trs.senderPublicKey.toString('hex') })
        .then(() => {
            modules.accounts.setAccountAndGet(data, cb);
        });
};

/**
 * Checks trs delegate and no nameexist and calls modules.accounts.setAccountAndGet() with u_username.
 * @implements module:accounts#Accounts~setAccountAndGet
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @todo delete extra parameter block.
 */
Delegate.prototype.undo = function (trs, block, sender, cb) {
    const data = {
        address: sender.address,
        isDelegate: 0,
        vote: 0
    };

    if (!sender.nameexist && trs.asset.delegate.username) {
        data.username = null;
    }

    library.db.none(sql.removeDelegateVoteRecord, { publicKey: trs.senderPublicKey.toString('hex') })
        .then(() => {
            modules.accounts.setAccountAndGet(data, cb);
        });
};

/**
 * Checks trs delegate and calls modules.accounts.setAccountAndGet() with u_username.
 * @implements module:accounts#Accounts~setAccountAndGet
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 */
Delegate.prototype.applyUnconfirmed = function (trs, sender, cb) {
    const data = {
        address: sender.address,
        u_isDelegate: 1,
        u_username: trs.asset.delegate.username,
    };

    modules.accounts.setAccountAndGet(data, cb);
};

/**
 * Checks trs delegate and calls modules.accounts.setAccountAndGet() with
 * username and u_username both null.
 * @implements module:accounts#Accounts~setAccountAndGet
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 */
Delegate.prototype.undoUnconfirmed = function (trs, sender, cb) {
    const data = {
        address: sender.address,
        u_isDelegate: 0,
        u_username: null,
    };

    modules.accounts.setAccountAndGet(data, cb);
};

Delegate.prototype.calcUndoUnconfirmed = (trs, sender) => {
    sender.u_isDelegate = 0;
    sender.u_username = null;
};

Delegate.prototype.schema = {
    id: 'Delegate',
    type: 'object',
    properties: {
        username: {
            type: 'string',
            minLength: 1,
            maxLength: 20
        }
    },
    required: ['username']
};

/**
 * Validates transaction delegate schema.
 * @param {transaction} trs
 * @returns {err|trs} Error message if fails validation | input parameter.
 * @throws {string} Failed to validate delegate schema.
 */
Delegate.prototype.objectNormalize = function (trs) {
    const report = library.schema.validate(trs.asset.delegate, Delegate.prototype.schema);

    if (!report) {
        throw `Failed to validate delegate schema: ${this.scope.schema.getLastErrors()
            .map(err => err.message)
            .join(', ')}`;
    }

    return trs;
};

/**
 * Creates delegate Object based on raw data.
 * @param {Object} raw - Contains d_username, t_senderPK, t_senderId.
 * @returns {null|Object} Null if no d_username, otherwise created delegate object.
 */
Delegate.prototype.dbRead = function (raw) {
    if (!raw.d_username) {
        return null;
    }
    const delegate = {
        username: raw.d_username,
        publicKey: raw.t_senderPublicKey,
        address: raw.t_senderId
    };

    return { delegate };
};

Delegate.prototype.dbTable = 'delegates';

Delegate.prototype.dbFields = [
    'username',
    'transactionId'
];

/**
 * Creates Object based on trs data.
 * @param {transaction} trs - Contains delegate username.
 * @returns {Object} {table:delegates, username and transaction id}.
 */
Delegate.prototype.dbSave = function (trs) {
    return {
        table: this.dbTable,
        fields: this.dbFields,
        values: {
            username: trs.asset.delegate.username,
            transactionId: trs.id
        }
    };
};

/**
 * Evaluates transaction signatures and sender multisignatures.
 * @param {transaction} trs - signatures.
 * @param {account} sender
 * @return {Boolean} logic based on trs signatures and sender multisignatures.
 */
Delegate.prototype.ready = function (trs, sender) {
    if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
        if (!Array.isArray(trs.signatures)) {
            return false;
        }
        return trs.signatures.length >= sender.multimin;
    }
    return true;
};

// Export
module.exports = Delegate;

/** ************************************* END OF FILE ************************************ */
