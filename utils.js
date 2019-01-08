

let esClient = require('./elasticsearch/connection');
let Accounts = require('./modules/accounts');

//FIXME: validate client here. currently not implemented 
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
	for (let key in b) {
		if (b.hasOwnProperty(key)) {
			if (exports.merge.call(b, key) && b[key]) {
				if ('object' === typeof (b[key])) {
					if ('undefined' === typeof (a[key])) a[key] = {};
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
    let bulk = [], indexId;
    for (let current in list) {
        if (list[current].stakeId) {
            indexId = list[current].id;
        } else {
            indexId = list[current].b_height;
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
	return new Promise(function(resolve, reject) {
		esClient.bulk({
			maxRetries: 5,
			index: index,
			type: index,
			body: bulk
		}, function (err) {
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
    return currDate.getFullYear() + '-' + ('0' + (currDate.getMonth() + 1)).slice(-2) + '-' + ('0' + currDate.getDate()).slice(-2) + '.log';
};

/**
 * @author Hotam Singh
 * @desc Deletes a record from elasticsearch if removed from the database
 * @implements {Deletes records from esClient}
 * @param {doc} containes info regarding document to be deleted i.e index, type, id
 * @returns {String} || null
 */

exports.deleteDocument = function (doc) {
    (async function () {
        await esClient.delete({
            index: doc.index,
            type: doc.type,
            id: doc.id
        }, function (err, res) {
            if (err) {
                return err.message;
            } else {
                return null;
            }
        });
    })();
};

/**
 * @author Hotam Singh
 * @desc Deletes a record from elasticsearch if removed from the database based on query
 * @implements {Deletes records from esClient}
 * @param {doc} containes info regarding document to be deleted i.e index, type, id, body
 * @returns {String} || null
 */
exports.deleteDocumentByQuery = function (doc) {
    (async function () {
        await esClient.deleteByQuery({
            index: doc.index,
            type: doc.type,
            body: doc.body
        }, function (err, res) {
            if (err) {
                return err.message;
            } else {
                return null;
            }
        });
    })();
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
        }, function (err, res) {
            if (err) {
                return err.message;
            } else {
                return null;
            }
        });
    })();
};

exports.addDocument = async function (doc) {
    await esClient.index({
        index: doc.index,
        type: doc.type,
        body: doc.body,
        id: doc.id
    }, function (err) {
        if (err) {
            return err.message;
        } else {
            return null;
        }
    })
};