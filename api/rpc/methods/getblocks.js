const ReservedErrorCodes = require('./../errors');
const { createServerRPCMethod, validator } = require('./../util');
const { getBlocks } = require('../../../schema/blocks');


const METHOD_NAME = 'getblocks';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetBlocks (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getBlocks)) {
      scope.modules.blocks.submodules.api.getBlocks({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    }
    else {
      return {error: 'Failed operation'}
    }

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetBlocks);
