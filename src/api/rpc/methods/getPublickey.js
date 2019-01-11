const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(

  'GET_PUBLICKEY',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      scope.modules.accounts.shared.getPublickey({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    });
  });
