const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getbalance';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetBalance (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.accounts.shared.getBalance({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetBalance);
