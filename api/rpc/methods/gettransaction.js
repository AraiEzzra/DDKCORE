const { createServerRPCMethod, validator } = require('./../util');
const { getTransaction } = require('../../../schema/transactions');


const METHOD_NAME = 'gettransaction';

/**
 *
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetTransaction (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getTransaction)) {
      scope.modules.transactions.shared.getTransaction({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    }
    else {
      return {error: 'Failed operation'}
    }

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetTransaction);
