const { createServerRPCMethod } = require('../util');

module.exports = createServerRPCMethod(

  'ADD_DELEGATE',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      scope.modules.delegates.shared.addDelegate({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    });
  });
