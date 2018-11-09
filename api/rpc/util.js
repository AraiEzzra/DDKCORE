
module.exports.createServerRPCMethod = function (methodName, callback) {

  Object.defineProperty(callback, 'methodName', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: methodName
  });

  Object.defineProperty(callback, 'methodId', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: 0
  });

  return callback;
};

module.exports.validator = function(json, schema) {
  const ZSchema = require("z-schema");
  const validator = new ZSchema();
  return validator.validate(json, schema);
};
