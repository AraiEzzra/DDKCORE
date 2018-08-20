const { createServerRPCMethod, validator } = require('./../util');
const { getBlock } = require('../../../schema/blocks');


const METHOD_NAME = 'getblock';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetBlock (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getBlock)) {
      scope.modules.blocks.submodules.api.getBlock({body: params}, (error, result) => {

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

module.exports = createServerRPCMethod(METHOD_NAME, GetBlock);
