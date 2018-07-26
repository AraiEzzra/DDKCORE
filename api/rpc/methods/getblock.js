const ReservedErrorCodes = require('./../errors');
const Blocks = require('../../../modules/blocks');
const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getblock';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - The results from current execution,
 * @constructor
 */
function GetBlock (wss, params, scope, cb) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getBlock({body: params}, (err, result) => {
      if (!err) {
        resolve(result);
      } else {
        err(new Error('Error of GetBlock method'))
      }
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetBlock);