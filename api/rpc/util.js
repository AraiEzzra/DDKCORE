
module.exports.createServerApiMethod = function (methodName, callback) {

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

module.exports.prepareServerError  = function (code, message, data) {
  return {
    code: code,
    message: message,
    data: data,
  };
};

module.exports.prepareServerRequest = function(result, error, id) {
  return {
    jsonrpc: "2.0",
    result: result,
    error: error,
    id: id,
  };
};

module.exports.prepareClientRequest = function(method, params, id) {
    return {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: id,
    };
};


