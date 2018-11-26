const { createServerRPCMethod, validator } = require('./../util');
const ReservedError = require('./../errors');
const { getBlock } = require('../../../schema/blocks');


module.exports = createServerRPCMethod(

  'GET_BLOCK',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, getBlock)) {
        scope.modules.blocks.submodules.api.getBlock({body: params}, (error, result) => {

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
