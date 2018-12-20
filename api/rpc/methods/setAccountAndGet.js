const { createServerRPCMethod } = require('./../util');


module.exports = createServerRPCMethod(

  'SET_ACCOUNT_AND_GET',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      scope.modules.accounts.setAccountAndGet(params, (error, result) => {
        resolve(error
          ? {error}
          : result);
      });
    });
  });
