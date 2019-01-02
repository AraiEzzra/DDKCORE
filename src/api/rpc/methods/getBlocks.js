const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { getBlocks } = require('../../../schema/blocks');


module.exports = createServerRPCMethod(

  'GET_BLOCKS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      if (schemaValidator(params, getBlocks)) {
        scope.modules.blocks.submodules.api.getBlocks({body: params}, (error, result) => {

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
