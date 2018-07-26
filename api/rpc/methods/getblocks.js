const ReservedErrorCodes = require('./../errors');
const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getblocks';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - The results from current execution,
 * @constructor
 */
function GetBlocks (wss, params, scope, cb) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getBlocks({body: params}, (err, result) => {
      if (!err) {
        resolve(result);
      } else {
        err(new Error('Error of GetBlocks method'))
      }
    });

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetBlocks);
