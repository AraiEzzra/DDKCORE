'use strict';

var esClient = require('./elasticsearch/connection');
var Accounts = require('./modules/accounts');

//FIXME: validate client here. currently not implemented 
exports.validateClient = function (req, res, next) {
	next();
};

/**
 * Merge object `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 */

exports.merge = function merge(a, b) {
	for (var key in b) {
		if (exports.merge.call(b, key) && b[key]) {
			if ('object' === typeof (b[key])) {
				if ('undefined' === typeof (a[key])) a[key] = {};
				exports.merge(a[key], b[key]);
			} else {
				a[key] = b[key];
			}
		}
	}
	return a;
};

/**
 * Make bulk data to be saved on elasticsearch server.
 *
 * @param {Object} list
 * @param {Object} bulk
 */
exports.makeBulk = function (list, index) {
	var bulk = [], indexId;
	for (var current in list) {
		if (list[current].stakeId) {
			indexId = list[current].stakeId;
		} else if (list[current].id) {
			indexId = list[current].id;
		} else if (list[current].transactionId) {
			indexId = list[current].transactionId;
		} else if (list[current].address) {
			indexId = list[current].address;
		} else {
			indexId = list[current].height;
		} 
		if(index === 'blocks') {
			list[current].generatorId = Accounts.prototype.generateAddressByPublicKey(list[current].generatorPublicKey);
		}
		
		bulk.push(
			{ index: { _index: index, _type: index, _id: indexId } },
			list[current]
		);
	}
	return bulk;
};

/**
 * Index data on elasticsearch server.
 *
 * @param {Object} list
 * @param {Object} bulk
 */
exports.indexall = function (bulk, index) {
	return new Promise(function(resolve, reject) {
		esClient.bulk({
			maxRetries: 5,
			index: index,
			type: index,
			body: bulk
		}, function (err, resp, status) {
			if (err) {
				reject(err);
			} else {
				resolve(null);
			}
		});
	})
};