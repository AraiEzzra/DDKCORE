let util = require('util');

module.exports = JsonSchemaField;

let Field = require('../validator').prototype.Field;

function JsonSchemaField (validator, path, value, rule, thisArg) {
	Field.call(this, validator, path, value, rule, thisArg);
}

util.inherits(JsonSchemaField, Field);
