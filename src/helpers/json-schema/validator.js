const utils = require('../validator/utils');

module.exports = JsonSchema;

const Validator = require('../validator/validator');
const Field = require('./field');

function JsonSchema(options) {
    Validator.call(this, options);
}

utils.inherits(JsonSchema, Validator);

JsonSchema.prototype.Field = JsonSchema.Field = Field;

JsonSchema.prototype.rules = JsonSchema.rules = {};

JsonSchema.addRule = Validator.addRule;
JsonSchema.fieldProperty = Validator.fieldProperty;

// Add fast call
JsonSchema.options = utils.extend({}, Validator.options);
JsonSchema.validate = Validator.validate;

JsonSchema.addRule('type', {
    validate(accept, value) {
        switch (accept) {
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null;
            case 'null':
                return value === null;
            case 'integer':
                return typeof value === 'number';
            default:
                return typeof value === accept;
        }
    }
});

JsonSchema.addRule('default', {
    filter(accept, value) {
        if (typeof value === 'undefined') {
            return accept;
        }
        return value;
    }
});

JsonSchema.addRule('enum', {
    validate(accept, value) {
        return accept.indexOf(value) > -1;
    }
});

// String rules

JsonSchema.addRule('case', {
    validate(accept, value) {
        if (accept === 'lower') {
            return String(value).toLowerCase() === String(value);
        } else if (accept === 'upper') {
            return String(value).toUpperCase() === String(value);
        }
        return true;
    }
});

JsonSchema.addRule('minLength', {
    validate(accept, value) {
        return String(value).length >= accept;
    }
});

JsonSchema.addRule('maxLength', {
    validate(accept, value) {
        return String(value).length <= accept;
    }
});

JsonSchema.addRule('pattern', {
    validate(accept, value) {
        if (accept instanceof RegExp === false) {
            accept = new RegExp(accept);
        }
        return accept.test(value);
    }
});

// Numeric rules

JsonSchema.addRule('minimum', {
    validate(accept, value, field) {
        if (field.rules.exclusiveMinimum) {
            return value > accept;
        }
        return value >= accept;
    }
});

JsonSchema.addRule('exclusiveMinimum', {});

JsonSchema.addRule('maximum', {
    validate(accept, value, field) {
        if (field.rules.exclusiveMaximum) {
            return value < accept;
        }
        return value <= accept;
    }
});

JsonSchema.addRule('exclusiveMaximum', {});

JsonSchema.addRule('divisibleBy', {
    validate(accept, value) {
        return value % accept === 0;
    }
});

// Object rules

JsonSchema.addRule('properties', {
    validate(accept, value, field) {
        if (!field.isObject()) {
            return;
        }

        field.async((done) => {
            const result = {};
            const properties = Object.getOwnPropertyNames(accept);

            Object.keys(value).forEach((property) => {
                if (properties.indexOf(property) < 0) {
                    properties.push(property);
                }
            });

            let l = properties.length;

            const additionalProperty = field.rules.additionalProperties || false;

            function end(err) {
                if (l === null) {
                    return;
                }

                --l;

                if (err) {
                    l = null;
                }

                if (!l) {
                    done(err);
                }
            }

            properties.forEach((property) => {
                let acceptProperty;

                if (!accept.hasOwnProperty(property)) {
                    if (additionalProperty === true) {
                        result[property] = value[property];
                        return end(); // Accept anyway
                    } else if (additionalProperty) {
                        acceptProperty = additionalProperty; // Check custom property to match additionalProperties
                    } else {
                        return end();
                    }
                } else if (!value.hasOwnProperty(property)) {
                    acceptProperty = accept[property];
                    if (acceptProperty.hasOwnProperty('default')) {
                        result[property] = acceptProperty.default;
                    }
                    return end();
                } else {
                    acceptProperty = accept[property];
                }

                const child = field.child(property, value[property], acceptProperty, value);
                child.validate((err, report, value) => {
                    result[property] = value;

                    end(err);
                });
            });
        });
    }
});

JsonSchema.addRule('additionalProperties', {});

JsonSchema.addRule('minProperties', {
    validate(accept, value) {
        return Object.keys(value).length >= accept;
    }
});

JsonSchema.addRule('maxProperties', {
    validate(accept, value) {
        return Object.keys(value).length <= accept;
    }
});

JsonSchema.addRule('required', {
    validate(accept, value, field) {
        accept.forEach((property) => {
            if (value.hasOwnProperty(property)) {
                return;
            }

            field.issue({
                path: property,
                rule: 'required'
            });
        });
    }
});

// Array rules

// TODO Add items as Array value
// TODO Add additionalItems

JsonSchema.addRule('items', {
    validate(accept, value, field) {
        if (!Array.isArray(value)) {
            return;
        }

        field.async((done) => {
            const result = [];
            let l = value.length;

            function end(err) {
                if (l === null) {
                    return;
                }

                --l;

                if (err) {
                    l = null;
                }

                if (!l) {
                    done(err);
                }
            }

            value.forEach((item, i) => {
                const child = field.child(i, item, accept, value);
                child.validate((err, report, value) => {
                    if (err) {
                        return end(err);
                    }

                    result[i] = value;

                    end();
                });
            });
        });
    }
});

JsonSchema.addRule('minItems', {
    validate(accept, value) {
        return Array.isArray(value) && value.length >= accept;
    }
});


JsonSchema.addRule('maxItems', {
    validate(accept, value) {
        return Array.isArray(value) && value.length <= accept;
    }
});

JsonSchema.addRule('uniqueItems', {
    validate(accept, value, field) {
        if (!accept) {
            return;
        }
        if (!Array.isArray(value)) {
            return;
        }

        let i = -1;
        const l = value.length;
        const unique = [];
        let item;

        while (++i < l) {
            item = value[i];

            if (unique.indexOf(item) > -1) {
                field.issue({
                    path: i,
                    rule: 'uniqueItems',
                    accept: true
                });
            } else {
                unique.push(item);
            }
        }

        return Array.isArray(value) && value.length >= accept;
    }
});

/** ************************************* END OF FILE ************************************ */
