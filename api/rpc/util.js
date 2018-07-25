
module.exports.METHOD_RESULT_STATUS = {
  DONE: 'done',
  ERROR: 'error',
  SUCCESS: 'success',
};

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

module.exports.randomString = function () {
  return Math.random().toString(36).substring(2).toUpperCase();
};

module.exports.prepareServerMethodResult = function(status, result, error) {
  return {status, result, error};
};

module.exports.hasProperties = function(obj, props) {
  return props.every((prop) => {
    return obj.hasOwnProperty(prop);
  });
};

module.exports.getDDKCoinConfig = function(name) {
  let config = require('./../../config');
  if ( !name ) {
    return config;
  }
  return config[name];
};
