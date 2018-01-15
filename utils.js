'use strict';

//hotam: validate client
exports.validateClient = function(req, res, next) {
	//validate client here. currently not implemented
    next();
};

/**
 * Merge object `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function merge(a, b) {
	for (var key in b) {
		if (exports.merge.call(b, key) && b[key]) {
			if ('object' === typeof(b[key])) {
				if ('undefined' === typeof(a[key])) a[key] = {};
					exports.merge(a[key], b[key]);
			} else {
				a[key] = b[key];
			}
		}
	}
	return a;
};

