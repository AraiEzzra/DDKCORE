const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { addTransactions } = require('../../../schema/transactions');


module.exports = createServerRPCMethod(

  'ADD_TRANSACTIONS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      if (schemaValidator(params, addTransactions)) {
        scope.modules.transactions.shared.addTransactions({body: params}, (error, result) => {

          resolve(error
            ? {error}
            : result);
        });
      }
      else {
        return {error: ReservedError.ServerErrorInvalidMethodParameters}
      }
    });
  });
