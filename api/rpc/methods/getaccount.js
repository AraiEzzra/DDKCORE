const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getaccount';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetAccount (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.accounts.shared.getAccount({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetAccount);
