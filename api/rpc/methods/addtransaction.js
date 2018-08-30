const { createServerRPCMethod, validator } = require('./../util');
const { addTransactions } = require('../../../schema/transactions');


const METHOD_NAME = 'addtransaction';

/**
 *
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function AddTransaction (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, addTransactions)) {
      scope.modules.transactions.shared.addTransactions({body: params}, (error, result) => {

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

module.exports = createServerRPCMethod(METHOD_NAME, AddTransaction);
