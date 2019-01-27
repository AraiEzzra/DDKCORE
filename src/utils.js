const esClient = require('./elasticsearch/connection');
const Accounts = require('./modules/accounts');
const Logger = require('./logger.js');

const logger = new Logger().logger;

// FIXME: validate client here. currently not implemented
exports.validateClient = function (req, res, next) {
    next();
};

/**
 * @desc Merge object `b` into `a`.
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 */

exports.merge = function merge(a, b) {
    for (const key in b) {
        if (b.hasOwnProperty(key)) {
            if (exports.merge.call(b, key) && b[key]) {
                if (typeof (b[key]) === 'object') {
                    if (typeof (a[key]) === 'undefined') a[key] = {};
                    exports.merge(a[key], b[key]);
                } else {
                    a[key] = b[key];
                }
            }
        }
    }
    return a;
};

/**
 * @desc Make bulk data to be saved on elasticsearch server.
 * @param {Array} list
 * @param {String} index
 * @param {Array} bulk
 * @returns {Array} bulk
 */
exports.makeBulk = function (list, index) {
    let bulk = [],
        indexId;
    for (const current in list) {
        if (list[current].stakeId || list[current].rowId) {
            indexId = list[current].id;
        } else if (list[current].b_height) {
            indexId = list[current].b_id;
        }
        if (index === 'blocks_list') {
            list[current].b_generatorId = Accounts.prototype.generateAddressByPublicKey(list[current].b_generatorPublicKey);
        }

        bulk.push(
            { index: { _index: index, _type: index, _id: indexId } },
            list[current]
        );
    }
    return bulk;
};

/**
 * @desc creating bulk index based on data on elasticsearch server.
 * @param {String} index
 * @param {Object} bulk
 * @returns {Promise} {Resolve|Reject}
 */
exports.indexall = function (bulk, index) {
    return new Promise((resolve, reject) => {
        esClient.bulk({
            maxRetries: 5,
            index,
            type: index,
            body: bulk
        }, (err) => {
            logger.error(`[Elasticsearch] [indexall]: ${err.message}`);
            if (err) {
                reject(err);
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * @desc generate a file based on today's date and ignore this file before archiving
 * @implements {formatted date based file name}
 * @param {Date} currDate
 * @returns {String}
 */
exports.getIgnoredFile = function (currDate) {
    return `${currDate.getFullYear()}-${(`0${currDate.getMonth() + 1}`).slice(-2)}-${(`0${currDate.getDate()}`).slice(-2)}.log`;
};

/**
 * @author Hotam Singh
 * @desc Deletes a record from elasticsearch if removed from the database
 * @implements {Deletes records from esClient}
 * @param {doc} containes info regarding document to be deleted i.e index, type, id
 * @returns {String} || null
 */

exports.deleteDocument = async (doc) => {
    try {
        return await esClient.delete(doc);
    } catch (error) {
        logger.error(`[Elasticsearch][deleteDocument]: ${error.message}`);
    }
};

/**
 * @author Hotam Singh
 * @desc Deletes a record from elasticsearch if removed from the database based on query
 * @implements {Deletes records from esClient}
 * @param {doc} containes info regarding document to be deleted i.e index, type, id, body
 * @returns {String} || null
 */
exports.deleteDocumentByQuery = async (doc) => {
    try {
        return await esClient.deleteByQuery(doc);
    } catch (error) {
        logger.error(`[Elasticsearch][deleteDocumentByQuery]: ${error.message}`);
    }
};

/**
 * @author Hotam Singh
 * @desc Updates a record from elasticsearch if updated in the database
 * @implements {updates records in esClient}
 * @param {doc} containes info regarding document to be deleted i.e index, type, id, body
 * @returns {String} || null
 */

exports.updateDocument = function (doc) {
    (async function () {
        await esClient.update({
            index: doc.index,
            type: doc.type,
            body: {
                doc: doc.body
            },
            id: doc.id
        }, (err, res) => {
            if (err) {
                logger.error(`[Elasticsearch] [updateDocument]: ${err.message}`);
                return err.message;
            }
            return null;
        });
    }());
};

exports.addDocument = async function (doc) {
    await esClient.index({
        index: doc.index,
        type: doc.type,
        body: doc.body,
        id: doc.id
    }, (err) => {
        if (err) {
            logger.error(`[Elasticsearch] [addDocument]: ${err.message}`);
            return err.message;
        }
        return null;
    });
};
