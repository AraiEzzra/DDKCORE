

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
			indexId = list[current].stakeId;
		} else if (list[current].id) {
			indexId = list[current].id;
		} else if (list[current].transactionId) {
			indexId = list[current].transactionId;
		} else if (list[current].address) {
			indexId = list[current].address;
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
exports.getIgnoredFile = function(currDate) {
	return currDate.getFullYear()+'-'+('0' + (currDate.getMonth() + 1)).slice(-2)+'-'+('0' + currDate.getDate()).slice(-2)+'.log';
};
