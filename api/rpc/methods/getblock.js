const ReservedErrorCodes = require('./../errors');
const Blocks = require('../../../modules/blocks');
const { createServerRPCMethod, validator } = require('./../util');
const { getBlock } = require('../../../schema/blocks');


const METHOD_NAME = 'getblock';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - The results from current execution,
 * @constructor
 */
function GetBlock (wss, params, scope, cb) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getBlock)) {
      scope.modules.blocks.submodules.api.getBlock({body: params}, (errorMessage, result) => {

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

module.exports = createServerRPCMethod(METHOD_NAME, GetBlock);