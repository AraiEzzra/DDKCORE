const { LENGTH, writeUInt64LE } = require('../helpers/buffer.js');
const sql = require('../sql/referal_sql');
const constants = require('../helpers/constants');

let modules,
    library,
    self;

/**
 * Referral logic.
 * @class
 */
function Referral(logger, schema, db, account) {
    self = this;
    library = {
        db,
        logger,
        schema,
        account
    };
    return this;
}

Referral.prototype.bind = function () {
    modules = {};
};

Referral.prototype.create = async function (data, trs) {
    trs.recipientId = null;
    trs.asset.referral = data.referral;
    trs.trsName = 'REGISTER';
    return trs;
};

Referral.prototype.getBytes = function (trs) {
    const buff = Buffer.alloc(LENGTH.INT64);

    const offset = 0;
    if (trs.asset && trs.asset.referral) {
        const id = parseInt(trs.asset.referral.slice(3), 10) || 0;
        writeUInt64LE(buff, id, offset);
    }
    return buff;
};

Referral.prototype.verify = function (trs, sender, cb) {
    library.account.get({ address: trs.senderId }, (err, account) => {
        if (account && account.global) {
            if (constants.REFERRAL_TRANSACTION_VALIDATION_ENABLED.GLOBAL_ACCOUNT) {
                return setImmediate(cb, 'Account already exists.');
            }
            library.logger.error('Account already exists');
        }
        return setImmediate(cb);
    });
};

Referral.prototype.newVerify = async (trs, sender) => {
    if (sender && sender.global) {
        throw new Error('Account already exists.');
    }
};

Referral.prototype.verifyUnconfirmed = function (trs, sender, cb) {
    return setImmediate(cb);
};

Referral.prototype.newVerifyUnconfirmed = async () => {};

Referral.prototype.apply = function (trs, block, sender, cb) {
    library.db.none(sql.changeAccountGlobalStatus, {
        address: trs.senderId,
        status: true
    }).then(() => {
        setImmediate(cb);
    }).catch((err) => {
        setImmediate(cb, err);
    });
};

Referral.prototype.undo = async (trs) => {
    await library.db.none(sql.changeAccountGlobalStatus, {
        address: trs.senderId,
        status: false
    })
};

Referral.prototype.applyUnconfirmed = function (trs, sender, cb) {
    // TODO can be added u_global
    setImmediate(cb);
};

Referral.prototype.undoUnconfirmed = function (trs, sender, cb) {
    // TODO can be removed u_global
    setImmediate(cb);
};

Referral.prototype.calcUndoUnconfirmed = () => {};

Referral.prototype.schema = {
    id: 'Referral',
    type: 'object',
    properties: {
        address: {
            type: 'string',
            minLength: 1
        },
        level: {
            type: 'array'
        }
    },
    required: ['address', 'level']
};

Referral.prototype.dbRead = function (raw) {
    const asset = {};

    if (raw.ref_level && raw.ref_level.length) {
        asset.referral = raw.ref_level[0];
    }

    return asset;
};

Referral.prototype.dbTable = 'referals';

Referral.prototype.dbFields = [
    'address',
    'level'
];

Referral.prototype.dbSave = async function (trs) {
    let referral;
    try {
        referral = await library.db.oneOrNone(sql.referLevelChain, {
            address: trs.senderId,
        });
    } catch (error) {
        library.logger.error(`Cannot get referral row from db. ${error}`);
        return null;
    }

    if (referral) {
        return null;
    }

    const level = [];
    if (trs.asset.referral) {
        try {
            referral = await library.db.oneOrNone(sql.referLevelChain, {
                address: trs.asset.referral,
            });
        } catch (error) {
            library.logger.error(`Cannot get referral row from db. ${error}`);
            return null;
        }


        if (!referral || !referral.level) {
            level.push(trs.asset.referral);
        } else {
            if (referral.level.length > 14) {
                referral.level.length = 14;
            }
            level.push(trs.asset.referral, ...referral.level);
        }
    }

    return {
        table: this.dbTable,
        fields: this.dbFields,
        values: {
            address: trs.senderId,
            level: `{${level.toString()}}`,
        }
    };
};

Referral.prototype.ready = function () {
    return true;
};

Referral.prototype.calculateFee = function () {
    return 0;
};

Referral.prototype.objectNormalize = function (trs) {
    return trs;
};

Referral.prototype.process = function (trs, sender, cb) {
    return setImmediate(cb, null, trs);
};

module.exports = Referral;

/** ************************************* END OF FILE ************************************ */
