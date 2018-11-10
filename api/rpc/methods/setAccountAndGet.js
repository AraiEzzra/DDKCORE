const { createServerRPCMethod } = require('./../util');


module.exports = createServerRPCMethod(

  'SET_ACCOUNT_AND_GET',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      scope.modules.accounts.shared.setAccountAndGet({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    });
  });
