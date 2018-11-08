const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'setaccountandget';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function SetAccountAndGet (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.accounts.shared.setAccountAndGet({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, SetAccountAndGet);
