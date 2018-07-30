const ReservedErrorCodes = require('./../errors');
const { createServerRPCMethod, validator } = require('./../util');
const { getBlocks } = require('../../../schema/blocks');


const METHOD_NAME = 'getblocks';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - The results from current execution,
 * @constructor
 */
function GetBlocks (wss, params, scope, cb) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getBlocks)) {
      scope.modules.blocks.submodules.api.getBlocks({body: params}, (errorMessage, result) => {

        resolve(errorMessage
          ? {error: wss.createError(ReservedErrorCodes.ApplicationError, String(errorMessage))}
          : result);
      });
    }
    else {
      error = wss.createError(ReservedErrorCodes.ServerErrorInvalidMethodParameters, 'Failed operation');
      return {error}
    }

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetBlocks);
