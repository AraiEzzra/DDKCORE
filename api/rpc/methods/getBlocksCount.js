const { createServerRPCMethod } = require('./../util');


module.exports = createServerRPCMethod(

  'GET_BLOCKS_COUNT',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      scope.modules.blocks.submodules.api.getBlocks({body: {limit: 1}}, (error, result) => {

        resolve(error
          ? {error}
          : {count: result.count});
      });
    });
  });
