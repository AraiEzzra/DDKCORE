const { createServerRPCMethod } = require('./../util');


module.exports = createServerRPCMethod(

  'GET_NETHASH',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      scope.modules.blocks.submodules.api.getNethash({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    });
  });
