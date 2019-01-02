const { createServerRPCMethod } = require('./../util');


module.exports = createServerRPCMethod(

  'GET_NEXT_FORGERS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      scope.modules.delegates.shared.getNextForgers({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    });
  });
