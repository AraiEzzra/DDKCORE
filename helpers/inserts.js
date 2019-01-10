let pgp = require('pg-promise');

/**
 * Creates and returns an insert instance
 * @memberof module:helpers
 * @requires pg-promise
 * @class
 * @param {Object} record
 * @param {Object} values
 * @param {boolean} [concat]
 * @return {function} True if ip is in the list, false otherwise.
 * @throws {string} Error description
 */

function Inserts (record, values, concat) {
	if (!(this instanceof Inserts)) {
		return new Inserts(record, values, concat);
	}

	let self = this;

	if (!record || !record.table || !record.values) {
		throw 'Inserts: Invalid record argument';
	}

	if (!values) {
		throw 'Inserts: Invalid values argument';
	}

	this.namedTemplate = function () {
		return record.fields.map(function (field) {
			return '${' + field + '}';
		}).join(',');
	};

	this._template = this.namedTemplate();
	/**
	 * Creates pg insert sentence.
	 * @method
	 * @return {string} Sql sentence
	 */
	this.template = function () {
		let values;
		let fields = record.fields.map(pgp.as.name).join(',');
		if (concat) {
			values = '$1';
		} else {
			values = '(' + this.namedTemplate() + ')';
		}
		// TODO: https://trello.com/c/D3iBP5UZ/220-remove-on-conflict-do-nothing-from-inserts-function
		return pgp.as.format('INSERT INTO $1~($2^) VALUES $3^ ON CONFLICT DO NOTHING', [record.table, fields, values]);
	};

	this._rawDBType = true;

	this.formatDBType = function () {
		return values.map(function (v) {
			return '(' + pgp.as.format(self._template, v) + ')';
		}).join(',');
	};
}

module.exports = Inserts;

/*************************************** END OF FILE *************************************/
