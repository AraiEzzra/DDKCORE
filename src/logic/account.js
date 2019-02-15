const pgp = require('pg-promise');
const path = require('path');
const jsonSql = require('json-sql')();

jsonSql.setDialect('postgresql');
const constants = require('../helpers/constants.js');
const sql = require('../sql/referral');
const AccountsSQL = require('../sql/accounts');

let self;
let library;

/**
 * Main account logic.
 * @memberof module:accounts
 * @class
 * @classdesc Main account logic.
 * @param {Database} db
 * @param {ZSchema} schema
 * @param {Object} logger
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} With `this` as data.
 */

function Account(db, schema, logger, cb) {
    this.scope = {
        db,
        schema
    };

    self = this;
    library = {
        logger,
    };

    this.table = 'mem_accounts';
    /**
     * @typedef {Object} account
     * @property {string} username - Lowercase, between 1 and 20 chars.
     * @property {boolean} isDelegate
     * @property {boolean} u_isDelegate
     * @property {boolean} secondSignature
     * @property {boolean} u_secondSignature
     * @property {string} u_username
     * @property {address} address - Uppercase, between 1 and 25 chars.
     * @property {publicKey} publicKey
     * @property {publicKey} secondPublicKey
     * @property {number} balance - Between 0 and totalAmount from constants.
     * @property {number} u_balance - Between 0 and totalAmount from constants.
     * @property {number} vote
     * @property {number} rate
     * @property {String[]} delegates - From mem_account2delegates table, filtered by address.
     * @property {String[]} u_delegates - From mem_account2u_delegates table, filtered by address.
     * @property {String[]} multisignatures - From mem_account2multisignatures table, filtered by address.
     * @property {String[]} u_multisignatures - From mem_account2u_multisignatures table, filtered by address.
     * @property {number} multimin - Between 0 and 17.
     * @property {number} u_multimin - Between 0 and 17.
     * @property {number} multilifetime - Between 1 and 72.
     * @property {number} u_multilifetime - Between 1 and 72.
     * @property {string} blockId
     * @property {boolean} nameexist
     * @property {boolean} u_nameexist
     * @property {number} producedblocks - Between -1 and 1.
     * @property {number} missedblocks - Between -1 and 1.
     * @property {number} fees
     * @property {number} rewards
     * @property {boolean} virgin
     */
    this.model = [
        {
            name: 'username',
            type: 'String',
            filter: {
                type: 'string',
                case: 'lower',
                maxLength: 20,
                minLength: 1
            },
            conv: String,
            immutable: true
        },
        {
            name: 'isDelegate',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean
        },
        {
            name: 'u_isDelegate',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean
        },
        {
            name: 'secondSignature',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean
        },
        {
            name: 'u_secondSignature',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean
        },
        {
            name: 'u_username',
            type: 'String',
            filter: {
                type: 'string',
                case: 'lower',
                maxLength: 20,
                minLength: 1
            },
            conv: String,
            immutable: true
        },
        {
            name: 'address',
            type: 'String',
            filter: {
                required: true,
                type: 'string',
                case: 'upper',
                minLength: 1,
                maxLength: 25
            },
            conv: String,
            immutable: true,
        },
        {
            name: 'publicKey',
            type: 'String',
            filter: {
                type: 'string',
                format: 'publicKey'
            },
            immutable: true
        },
        {
            name: 'secondPublicKey',
            type: 'String',
            filter: {
                type: 'string',
                format: 'publicKey'
            },
            conv: String,
        },
        {
            name: 'balance',
            type: 'BigInt',
            filter: {
                required: true,
                type: 'integer',
                minimum: 0,
                maximum: constants.totalAmount
            },
            conv: Number,
            expression: '("balance")::bigint'
        },
        {
            name: 'u_balance',
            type: 'BigInt',
            filter: {
                required: true,
                type: 'integer',
                minimum: 0,
                maximum: constants.totalAmount
            },
            conv: Number,
            expression: '("u_balance")::bigint'
        },
        {
            name: 'vote',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("vote")::bigint'
        },
        {
            name: 'rate',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("rate")::bigint'
        },
        {
            name: 'delegates',
            type: 'Text',
            filter: {
                type: 'array',
                uniqueItems: true
            },
            conv: Array,
            expression: `(SELECT ARRAY_AGG("dependentId") FROM
            ${this.table}2delegates WHERE "accountId" = a."address")`
        },
        {
            name: 'u_delegates',
            type: 'Text',
            filter: {
                type: 'array',
                uniqueItems: true
            },
            conv: Array,
            expression: `(SELECT ARRAY_AGG("dependentId") FROM
            ${this.table}2u_delegates WHERE "accountId" = a."address")`
        },
        {
            name: 'url',
            type: 'String',
            filter: {
                type: 'string',
                case: 'lower',
                maxLength: 100,
                minLength: 1
            },
            conv: String
        },
        {
            name: 'multisignatures',
            type: 'Text',
            filter: {
                type: 'array',
                uniqueItems: true
            },
            conv: Array,
            expression: `(SELECT ARRAY_AGG("dependentId") FROM
            ${this.table}2multisignatures WHERE "accountId" = a."address")`
        },
        {
            name: 'u_multisignatures',
            type: 'Text',
            filter: {
                type: 'array',
                uniqueItems: true
            },
            conv: Array,
            expression: `(SELECT ARRAY_AGG("dependentId") FROM
            ${this.table}2u_multisignatures WHERE "accountId" = a."address")`
        },
        {
            name: 'multimin',
            type: 'SmallInt',
            filter: {
                type: 'integer',
                minimum: 0,
                maximum: 17
            },
            conv: Number
        },
        {
            name: 'u_multimin',
            type: 'SmallInt',
            filter: {
                type: 'integer',
                minimum: 0,
                maximum: 17
            },
            conv: Number
        },
        {
            name: 'multilifetime',
            type: 'SmallInt',
            filter: {
                type: 'integer',
                minimum: 1,
                maximum: 72
            },
            conv: Number
        },
        {
            name: 'u_multilifetime',
            type: 'SmallInt',
            filter: {
                type: 'integer',
                minimum: 1,
                maximum: 72
            },
            conv: Number
        },
        {
            name: 'blockId',
            type: 'String',
            filter: {
                type: 'string',
                minLength: 1,
                maxLength: 20
            },
            conv: String
        },
        {
            name: 'nameexist',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean
        },
        {
            name: 'u_nameexist',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean
        },
        {
            name: 'producedblocks',
            type: 'Number',
            filter: {
                type: 'integer',
                minimum: -1,
                maximum: 1
            },
            conv: Number
        },
        {
            name: 'missedblocks',
            type: 'Number',
            filter: {
                type: 'integer',
                minimum: -1,
                maximum: 1
            },
            conv: Number
        },
        {
            name: 'fees',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("fees")::bigint'
        },
        {
            name: 'rewards',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("rewards")::bigint'
        },
        {
            name: 'virgin',
            type: 'SmallInt',
            filter: {
                type: 'boolean'
            },
            conv: Boolean,
            immutable: true
        },
        {
            name: 'acc_type',
            type: 'SmallInt',
            filter: {
                type: 'SmallInt'
            },
            immutable: true
        },
        {
            name: 'transferedAmount',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("totalFrozeAmount")::bigint'

        },
        {
            name: 'u_totalFrozeAmount',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("u_totalFrozeAmount")::bigint'
        },
        {
            name: 'endTime',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number
        },
        {
            name: 'totalFrozeAmount',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("totalFrozeAmount")::bigint'
        },
        {
            name: 'group_bonus',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("group_bonus")::bigint'
        },
        {
            name: 'pending_group_bonus',
            type: 'BigInt',
            filter: {
                type: 'integer'
            },
            conv: Number,
            expression: '("pending_group_bonus")::bigint'
        },
        {
            name: 'introducer',
            type: 'String',
            filter: {
                required: false,
                type: 'string',
                case: 'upper',
                minLength: 1,
                maxLength: 25
            },
            conv: String,
            immutable: true,
        }
    ];

    // Obtains fields from model
    this.fields = this.model.map((field) => {
        const _tmp = {};

        if (field.expression) {
            _tmp.expression = field.expression;
        } else {
            if (field.mod) {
                _tmp.expression = field.mod;
            }
            _tmp.field = field.name;
        }
        if (_tmp.expression || field.alias) {
            _tmp.alias = field.alias || field.name;
        }

        return _tmp;
    });

    // Obtains bynary fields from model
    this.binary = [];
    this.model.forEach((field) => {
        if (field.type === 'Binary') {
            this.binary.push(field.name);
        }
    });

    // Obtains filters from model
    this.filter = {};
    this.model.forEach((field) => {
        this.filter[field.name] = field.filter;
    });

    // Obtains conv from model
    this.conv = {};
    this.model.forEach((field) => {
        this.conv[field.name] = field.conv;
    });

    // Obtains editable fields from model
    this.editable = [];
    this.model.forEach((field) => {
        if (!field.immutable) {
            this.editable.push(field.name);
        }
    });

    return setImmediate(cb, null, this);
}

/**
 * Creates memory tables related to accounts:
 * - mem_accounts
 * - mem_round
 * - mem_accounts2delegates
 * - mem_accounts2u_delegates
 * - mem_accounts2multisignatures
 * - mem_accounts2u_multisignatures
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} cb|error.
 */
Account.prototype.createTables = function (cb) {
    // TODO: make it NORMAL
    const SQL = new pgp.QueryFile(path.join(process.cwd(), 'src/sql', 'memoryTables.sql'), { minify: true });

    self.scope.db.query(SQL)
        .then(() => setImmediate(cb))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Account#createTables error');
        });
};

/**
 * Deletes the contents of these tables:
 * - mem_round
 * - mem_accounts2delegates
 * - mem_accounts2u_delegates
 * - mem_accounts2multisignatures
 * - mem_accounts2u_multisignatures
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} cb|error.
 */
Account.prototype.removeTables = function (cb) {
    const sqles = [];

    [self.table,
        'mem_round',
        'mem_accounts2delegates',
        'mem_accounts2u_delegates',
        'mem_accounts2multisignatures',
        'mem_accounts2u_multisignatures'].forEach((table) => {
        const SQL = jsonSql.build({
            type: 'remove',
            table
        });
        sqles.push(SQL.query);
    });

    self.scope.db.query(sqles.join(''))
        .then(() => setImmediate(cb))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Account#removeTables error');
        });
};

/**
 * Validates account schema.
 * @param {account} account
 * @returns {err|account} Error message or input parameter account.
 * @throws {string} If schema.validate fails, throws 'Failed to validate account schema'.
 */
Account.prototype.objectNormalize = function (account) {
    const report = self.scope.schema.validate(account, {
        id: 'Account',
        object: true,
        properties: self.filter
    });

    if (!report) {
        throw `Failed to validate account schema:
        ${self.scope.schema.getLastErrors()
            .map(err => err.message)
            .join(', ')}`;
    }

    return account;
};

/**
 * Checks type, lenght and format from publicKey.
 * @param {publicKey} publicKey
 * @throws {string} throws one error for every check.
 */
Account.prototype.verifyPublicKey = function (publicKey) {
    if (publicKey !== undefined) {
        // Check type
        if (typeof publicKey !== 'string') {
            throw 'Invalid public key, must be a string';
        }
        // Check length
        if (publicKey.length < 64) {
            throw 'Invalid public key, must be 64 characters long';
        }
        // Check format
        try {
            Buffer.from(publicKey, 'hex');
        } catch (e) {
            throw 'Invalid public key, must be a hex string';
        }
    }
};

/**
 * Normalizes address and creates binary buffers to insert.
 * @param {Object} raw - with address and public key.
 * @returns {Object} Normalized address.
 */
Account.prototype.toDB = function (raw) {
    self.binary.forEach((field) => {
        if (raw[field]) {
            raw[field] = Buffer.from(raw[field], 'hex');
        }
    });

    // Normalize address
    raw.address = String(raw.address)
        .toUpperCase();

    return raw;
};

/**
 * Gets account information for specified fields and filter criteria.
 * @param {Object} filter - Contains address.
 * @param {Object|function} fields - Table fields.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} Returns null or Object with database data.
 */
Account.prototype.get = function (filter, fields, cb) {
    if (typeof (fields) === 'function') {
        cb = fields;
        fields = self.fields.map(field => field.alias || field.field);
    }

    self.getAll(filter, fields, (err, data) => setImmediate(cb, err, data && data.length ? data[0] : null));
};

/**
 * Gets accounts information from mem_accounts.
 * @param {Object} filter - Contains address.
 * @param {Object|function} fields - Table fields.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} data with rows | 'Account#getAll error'.
 */
Account.prototype.getAll = function (filter, fields, cb) {
    if (typeof (fields) === 'function') {
        cb = fields;
        fields = self.fields.map(field => field.alias || field.field);
    }

    const realFields = self.fields.filter(field => fields.indexOf(field.alias || field.field) !== -1);

    const realConv = {};
    Object.keys(self.conv)
        .forEach((key) => {
            if (fields.indexOf(key) !== -1) {
                realConv[key] = self.conv[key];
            }
        });

    let limit;
    let offset;
    let sort;

    if (filter.limit > 0) {
        limit = filter.limit;
    }
    delete filter.limit;

    if (filter.offset > 0) {
        offset = filter.offset;
    }
    delete filter.offset;

    if (filter.sort) {
        sort = filter.sort;
    }
    delete filter.sort;

    if (filter.address && filter.address.$in && filter.address.$in.length === 0) {
        return setImmediate(cb, 'Empty address');
    }

    const SQL = jsonSql.build({
        type: 'select',
        table: self.table,
        limit,
        offset,
        sort,
        alias: 'a',
        condition: filter,
        fields: realFields
    });

    self.scope.db.query(SQL.query, SQL.values)
        .then(rows => setImmediate(cb, null, rows))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Account#getAll error');
        });
};

/**
 * Sets fields for specific address in mem_accounts table.
 * @param {address} address
 * @param {Object} fields
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} cb | 'Account#set error'.
 */
Account.prototype.set = function (address, fields, cb) {
    // Verify public key
    self.verifyPublicKey(fields.publicKey);
    // Normalize address
    address = String(address)
        .toUpperCase();
    fields.address = address;

    const SQL = jsonSql.build({
        type: 'insertorupdate',
        table: self.table,
        conflictFields: ['address'],
        values: self.toDB(fields),
        modifier: self.toDB(fields)
    });

    self.scope.db.none(SQL.query, SQL.values)
        .then(() => setImmediate(cb))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Account#set error');
        });
};

Account.prototype.findReferralLevel = function (address, cb) {
    self.scope.db.query(sql.referLevelChain, {
        address
    }).then((user) => {
        if (user && !user.level) {
            user.level = [];
        }

        return setImmediate(cb, null, user);
    }).catch(err => setImmediate(cb, err));
};

/**
 * Updates account from mem_account with diff data belonging to an editable field.
 * Inserts into mem_round "address", "amount", "delegate", "blockId", "round"
 * based on field balance or delegates.
 * @param {address} address
 * @param {Object} diff - Must contains only mem_account editable fields.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback|cb|done} Multiple returns: done() or error.
 */
Account.prototype.merge = function (address, diff, cb) {
    library.logger.debug(`[Account][merge] address: ${address}, diff: ${JSON.stringify(diff)}`);

    const update = {};
    const remove = {};
    const insert = {};
    const insertObject = {};
    const removeObject = {};
    const round = [];

    // Verify public key
    self.verifyPublicKey(diff.publicKey);

    // Normalize address
    address = String(address).toUpperCase();

    self.editable.forEach((value) => {
        let val;
        let i;
        if (diff[value] !== undefined) {
            const trueValue = diff[value];
            switch (self.conv[value]) {
                case String:
                    update[value] = trueValue;
                    break;
                case Boolean:
                    update[value] = trueValue;
                    break;
                case Number:
                    if (isNaN(trueValue) || trueValue === Infinity) {
                        return setImmediate(cb, `Encountered unsane number: ${trueValue}`);
                    } else if (Math.abs(trueValue) === trueValue && trueValue !== 0) {
                        update.$inc = update.$inc || {};
                        update.$inc[value] = Math.floor(trueValue);
                        if (value === 'balance') {
                            round.push({
                                // TODO rewrite dependentId
                                query: 'INSERT INTO mem_round ("address", "amount", "delegate", "blockId", "round")' +
                                ' SELECT ${address}, (${amount})::bigint, "dependentId", ${blockId}, ${round}' +
                                ' FROM mem_accounts2delegates WHERE "accountId" = ${address};',
                                values: {
                                    address,
                                    amount: trueValue,
                                    blockId: diff.blockId,
                                    round: diff.round || 0
                                }
                            });
                        }
                    } else if (trueValue < 0) {
                        update.$dec = update.$dec || {};
                        update.$dec[value] = Math.floor(Math.abs(trueValue));
                        // If decrementing u_balance on account
                        if (update.$dec.u_balance) {
                            // Remove virginity and ensure marked columns become immutable
                            update.virgin = 0;
                        }
                        if (value === 'balance') {
                            round.push({
                                // TODO rewrite dependentId
                                query: 'INSERT INTO mem_round ("address", "amount", "delegate", "blockId",' +
                                ' "round") SELECT ${address}, (${amount})::bigint, "dependentId", ${blockId},' +
                                ' ${round} FROM mem_accounts2delegates WHERE "accountId" = ${address};',
                                values: {
                                    address,
                                    amount: trueValue,
                                    blockId: diff.blockId,
                                    round: diff.round || 0
                                }
                            });
                        }
                    }
                    break;
                case Array:
                    if (Object.prototype.toString.call(trueValue[0]) === '[object Object]') {
                        for (i = 0; i < trueValue.length; i++) {
                            val = trueValue[i];
                            if (val.action === '-') {
                                delete val.action;
                                removeObject[value] = removeObject[value] || [];
                                removeObject[value].push(val);
                            } else if (val.action === '+') {
                                delete val.action;
                                insertObject[value] = insertObject[value] || [];
                                insertObject[value].push(val);
                            } else {
                                delete val.action;
                                insertObject[value] = insertObject[value] || [];
                                insertObject[value].push(val);
                            }
                        }
                    } else {
                        for (i = 0; i < trueValue.length; i++) {
                            const math = trueValue[i][0];
                            val = null;
                            if (math === '-') {
                                val = trueValue[i].slice(1);
                                remove[value] = remove[value] || [];
                                remove[value].push(val);
                                if (value === 'delegates') {
                                    round.push({
                                        query: 'INSERT INTO mem_round ("address", "amount", "delegate",' +
                                        ' "blockId", "round") SELECT ${address}, (-balance)::bigint, ${delegate},' +
                                        ' ${blockId}, ${round} FROM mem_accounts WHERE address = ${address};',
                                        values: {
                                            address: address,
                                            delegate: val,
                                            blockId: diff.blockId,
                                            round: diff.round || 0
                                        }
                                    });
                                }
                            } else if (math === '+') {
                                val = trueValue[i].slice(1);
                                insert[value] = insert[value] || [];
                                insert[value].push(val);
                                if (value === 'delegates') {
                                    round.push({
                                        query: 'INSERT INTO mem_round ("address", "amount", "delegate", "blockId",' +
                                        ' "round") SELECT ${address}, (balance)::bigint, ${delegate}, ${blockId},' +
                                        ' ${round} FROM mem_accounts WHERE address = ${address};',
                                        values: {
                                            address,
                                            delegate: val,
                                            blockId: diff.blockId,
                                            round: diff.round || 0
                                        }
                                    });
                                }
                            } else {
                                val = trueValue[i];
                                insert[value] = insert[value] || [];
                                insert[value].push(val);
                                if (value === 'delegates') {
                                    round.push({
                                        query: 'INSERT INTO mem_round ("address", "amount", "delegate", "blockId",' +
                                        ' "round") SELECT ${address}, (balance)::bigint, ${delegate}, ${blockId},' +
                                        ' ${round} FROM mem_accounts WHERE address = ${address};',
                                        values: {
                                            address,
                                            delegate: val,
                                            blockId: diff.blockId,
                                            round: diff.round || 0
                                        }
                                    });
                                }
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    });

    const sqles = [];

    if (Object.keys(remove).length) {
        Object.keys(remove)
            .forEach((el) => {
                const SQL = jsonSql.build({
                    type: 'remove',
                    table: `${self.table}2${el}`,
                    condition: {
                        dependentId: { $in: remove[el] },
                        accountId: address
                    }
                });
                sqles.push(SQL);
            });
    }

    if (Object.keys(insert).length) {
        Object.keys(insert)
            .forEach((el) => {
                for (let i = 0; i < insert[el].length; i++) {
                    const SQL = jsonSql.build({
                        type: 'insert',
                        table: `${self.table}2${el}`,
                        values: {
                            accountId: address,
                            dependentId: insert[el][i]
                        }
                    });
                    sqles.push(SQL);
                }
            });
    }

    if (Object.keys(removeObject).length) {
        Object.keys(removeObject)
            .forEach((el) => {
                removeObject[el].accountId = address;
                const SQL = jsonSql.build({
                    type: 'remove',
                    table: `${self.table}2${el}`,
                    condition: removeObject[el]
                });
                sqles.push(SQL);
            });
    }

    if (Object.keys(insertObject).length) {
        Object.keys(insertObject)
            .forEach((el) => {
                insertObject[el].accountId = address;
                for (let i = 0; i < insertObject[el].length; i++) {
                    const SQL = jsonSql.build({
                        type: 'insert',
                        table: `${self.table}2${el}`,
                        values: insertObject[el]
                    });
                    sqles.push(SQL);
                }
            });
    }

    if (Object.keys(update).length) {
        const SQL = jsonSql.build({
            type: 'update',
            table: self.table,
            modifier: update,
            condition: {
                address
            }
        });
        sqles.push(SQL);
    }

    function done(err) {
        if (cb.length !== 2) {
            return setImmediate(cb, err);
        }
        if (err) {
            return setImmediate(cb, err);
        }
        self.get({ address }, cb);
    }

    const queries = sqles.concat(round).map(sql => pgp.as.format(sql.query, sql.values)).join('');

    library.logger.debug(`[Account][merge] queries: ${JSON.stringify(queries)}`);

    if (!cb) {
        return queries;
    }

    if (queries.length === 0) {
        return done();
    }

    self.scope.db.none(queries)
        .then(() => done())
        .catch((err) => {
            library.logger.error(err.stack);
            return done('Account#merge error');
        });
};

Account.prototype.asyncMerge = async (address, data) => {
    const set = [];
    const values = { address };

    // TODO old logic include also ['producedblocks', 'missedblocks', 'fees', 'vote', 'rate'];
    const accumulateFields = ['balance', 'u_balance', 'totalFrozeAmount', 'u_totalFrozeAmount'];

    Object.keys(data).forEach(field => {
        if (accumulateFields.indexOf(field) !== -1) {
            set.push(`"${field}" = "${field}" + \${${field}}`);
        } else {
            set.push(`"${field}" = \${${field}}`);
        }

        values[field] = data[field];
    });

    return self.scope.db.one(AccountsSQL.updateAccount(set), values);
};

/**
 * Removes an account from mem_account table based on address.
 * @param {address} address
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} Data with address | Account#remove error.
 */
Account.prototype.remove = function (address, cb) {
    const sql = jsonSql.build({
        type: 'remove',
        table: self.table,
        condition: {
            address
        }
    });
    self.scope.db.none(sql.query, sql.values)
        .then(() => setImmediate(cb, null, address))
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Account#remove error');
        });
};

// Export
module.exports = Account;
