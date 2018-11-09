const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'blockscount';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function BlocksCount (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getBlocks({body: {limit: 1}}, (error, result) => {

      resolve(error
        ? {error}
        : {count: result.count});
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, BlocksCount);
