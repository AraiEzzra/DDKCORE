const Logger = require('../logger.js');

const logger = new Logger().logger;

/**
 * @desc permorms cluster operations
 * @param {module} client - elasticsearch module
 */

const client = require('./connection.js');

/**
 *
 * @desc check if an index already exists in the cluster
 * @param {String} indexName - index name
 * @return bool - true or false
 *
 */

function isIndexExists(indexName) {
    const result = client.indices.exists({
        index: indexName
    });
    return result;
}
exports.isIndexExists = isIndexExists;

const createIndexBody = ({ limit }) => {
    return {
        index: {
            mapping: {
                total_fields: {
                    limit,
                }
            }
        }
    };
}
exports.createIndexBody = createIndexBody;

/**
 *
 * @desc create an index
 * @param {String} indexName - index name
 * @param {function} cb - Callback function.
 * @return {String} - err or null
 *
 */

function createIndex(indexName, body, cb) {
    client.indices.create({
        index: indexName,
        body: body,
    }, (err) => {
        if (err) {
            logger.debug(`[createIndex] Cannot create index for ${indexName}: ${err.message}`);
            cb(err);
        } else {
            cb();
        }
    });
}
exports.createIndex = createIndex;

/**
 *
 * @desc Delete an existing index
 * @param {String} indexName - index name
 * @param {function} cb - Callback function.
 * @return {String} - err or null
 *
 */
function deleteIndex(indexName, cb) {
    client.indices.delete({
        index: indexName
    }, (err) => {
        if (err) {
            cb(err);
        } else {
            cb(null);
        }
    });
}
exports.deleteIndex = deleteIndex;

/**
 *
 * @desc Search in elastic search
 * @param {String} index - index name
 * @param {Object} queryMatch - search query
 * @param {function} cb - Callback function.
 * @return {String} - err or null
 *
 */
function searchQuery(index, queryMatch, cb) {
    client.search({
        index,
        type: index,
        body: {
            query: {
                match: queryMatch
            },
        }
    }, (error, response) => {
        if (error) {
            cb(error);
        } else {
            cb(null, response.hits.hits);
        }
    });
}

exports.searchQuery = searchQuery;

/** ************************************* END OF FILE ************************************ */
